import { z } from 'zod';

import type { InstagramMediaDetails, InstagramPort } from '../../../application/ports/instagram.port';
import type { Env } from '../../config/env';
import { loadEnv } from '../../config/env';
import { logger } from '../../logging/logger';
import { MinIntervalLimiter } from '../../rate-limit/min-interval-limiter';

const graphMediaSchema = z
  .object({
    id: z.string(),
    media_type: z.string().optional(),
    media_product_type: z.string().optional(),
    permalink: z.string().url().optional(),
    media_url: z.string().url().optional(),
    timestamp: z.string().optional(),
    caption: z.string().optional(),
  })
  .passthrough();

const oEmbedSchema = z
  .object({
    media_id: z.string().optional(),
  })
  .passthrough();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class InstagramGraphApiAdapter implements InstagramPort {
  private readonly env: Env;

  private readonly limiter: MinIntervalLimiter;

  constructor(env?: Env) {
    this.env = env ?? loadEnv();
    this.limiter = new MinIntervalLimiter(this.env.META_API_MIN_INTERVAL_MS);
  }

  private buildMediaUrl(mediaId: string): string {
    const baseUrl = this.env.META_GRAPH_API_BASE_URL.replace(/\/+$/g, '');
    const version = this.env.META_GRAPH_API_VERSION.replace(/^\/+|\/+$/g, '');
    const requestUrl = new URL(`${baseUrl}/${version}/${encodeURIComponent(mediaId)}`);

    requestUrl.searchParams.set(
      'fields',
      'id,media_type,media_product_type,permalink,media_url,timestamp,caption',
    );
    requestUrl.searchParams.set('access_token', this.env.IG_ACCESS_TOKEN);

    return requestUrl.toString();
  }

  private async fetchWithRetry(url: string): Promise<Response> {
    const maxAttempts = 3;
    let delayMs = 400;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(this.env.META_API_TIMEOUT_MS),
      });

      if (response.ok) {
        return response;
      }

      const shouldRetry = response.status === 429 || response.status >= 500;
      if (!shouldRetry || attempt === maxAttempts) {
        const errorBody = await response.text();
        throw new Error(`Graph API request failed: status=${response.status} body=${errorBody}`);
      }

      logger.warn(
        { statusCode: response.status, attempt, delayMs },
        'Graph API returned retryable status; backing off',
      );
      await sleep(delayMs);
      delayMs *= 2;
    }

    throw new Error('Unreachable: Graph API retry exhausted');
  }

  async getMediaById(mediaId: string): Promise<InstagramMediaDetails> {
    const url = this.buildMediaUrl(mediaId);

    const response = await this.limiter.schedule(async () => this.fetchWithRetry(url));
    const payload = graphMediaSchema.parse(await response.json());

    if (!payload.permalink) {
      throw new Error(`Graph API media payload missing permalink for mediaId=${mediaId}`);
    }

    const parsedTimestamp =
      payload.timestamp && !Number.isNaN(Date.parse(payload.timestamp))
        ? new Date(payload.timestamp)
        : null;

    return {
      mediaId: payload.id,
      mediaType: payload.media_type ?? 'UNKNOWN',
      productType: payload.media_product_type ?? '',
      permalink: payload.permalink,
      mediaUrl: payload.media_url ?? null,
      caption: payload.caption ?? null,
      timestamp: parsedTimestamp,
      raw: payload as Record<string, unknown>,
    };
  }

  async getMediaByReelUrl(reelUrl: string): Promise<InstagramMediaDetails | null> {
    const baseUrl = this.env.META_GRAPH_API_BASE_URL.replace(/\/+$/g, '');
    const version = this.env.META_GRAPH_API_VERSION.replace(/^\/+|\/+$/g, '');
    const requestUrl = new URL(`${baseUrl}/${version}/instagram_oembed`);
    requestUrl.searchParams.set('url', reelUrl);
    requestUrl.searchParams.set('access_token', this.env.IG_ACCESS_TOKEN);

    const response = await this.limiter.schedule(async () =>
      fetch(requestUrl.toString(), {
        method: 'GET',
        signal: AbortSignal.timeout(this.env.META_API_TIMEOUT_MS),
      }),
    );

    if (!response.ok) {
      logger.warn({ statusCode: response.status }, 'Graph API oEmbed endpoint returned non-OK response');
      return null;
    }

    let payloadRaw: unknown;
    try {
      payloadRaw = await response.json();
    } catch {
      return null;
    }

    const parsedPayload = oEmbedSchema.safeParse(payloadRaw);
    if (!parsedPayload.success) {
      return null;
    }

    const payload = parsedPayload.data;
    const mediaId = payload.media_id;
    if (!mediaId || mediaId.trim().length === 0) {
      return null;
    }

    return this.getMediaById(mediaId);
  }
}
