import type { InstagramPort } from '../ports/instagram.port';
import type { TelegramPort } from '../ports/telegram.port';
import type { InstagramMediaRepository } from '../../domain/repositories/instagram-media-repository';
import type { MediaRequestRepository } from '../../domain/repositories/media-request-repository';
import type { ProcessingFailureRepository } from '../../domain/repositories/processing-failure-repository';
import { FETCH_MEDIA_REQUEST_JOB_NAME } from '../constants/queue-jobs';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalize(value: string): string {
  return value.trim().toUpperCase();
}

function isReelMedia(mediaType: string, productType: string): boolean {
  const normalizedType = normalize(mediaType);
  const normalizedProductType = normalize(productType);

  if (normalizedType === 'REELS' || normalizedType === 'IG_REEL') {
    return true;
  }

  return (
    normalizedType === 'VIDEO' &&
    ['REELS', 'IG_REEL', 'IG_REELS'].includes(normalizedProductType)
  );
}

function toErrorReason(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 512);
  }

  return 'unknown_error';
}

export interface ProcessMediaRequestInput {
  requestId: string;
}

export class ProcessMediaRequestUseCase {
  constructor(
    private readonly mediaRequestRepository: MediaRequestRepository,
    private readonly instagramMediaRepository: InstagramMediaRepository,
    private readonly instagramPort: InstagramPort,
    private readonly telegramPort: TelegramPort,
    private readonly processingFailureRepository: ProcessingFailureRepository,
    private readonly groupInviteLink: string,
    private readonly maxAttempts = 3,
  ) {}

  private async processOnce(requestId: string): Promise<void> {
    const request = await this.mediaRequestRepository.findById(requestId);
    if (!request) {
      return;
    }

    if (request.status === 'POSTED') {
      return;
    }

    await this.mediaRequestRepository.updateStatus({
      id: request.id,
      status: 'FETCHING',
      errorReason: null,
    });

    let instagramMediaId: string | null = null;
    let permalink = request.normalizedUrl;
    let caption: string | null = null;

    const media = await this.instagramPort.getMediaByReelUrl(request.normalizedUrl);
    if (media) {
      if (!isReelMedia(media.mediaType, media.productType)) {
        throw new Error('non_reel_media_detected');
      }

      const savedMedia = await this.instagramMediaRepository.upsertByMediaId({
        mediaId: media.mediaId,
        mediaType: media.mediaType,
        productType: media.productType,
        permalink: media.permalink,
        mediaUrl: media.mediaUrl,
        caption: media.caption,
        timestamp: media.timestamp,
        raw: media.raw,
      });

      instagramMediaId = savedMedia.mediaId;
      permalink = savedMedia.permalink;
      caption = savedMedia.caption;
    }

    await this.mediaRequestRepository.updateStatus({
      id: request.id,
      status: 'READY',
      instagramMediaId,
      errorReason: null,
    });

    if (request.chatId) {
      const text = caption && caption.trim().length > 0 ? `${caption}\n\n${permalink}` : permalink;
      await this.telegramPort.sendMessage({
        chatId: request.chatId,
        text,
        buttons: [
          {
            text: "Guruhga qo'shilish",
            url: this.groupInviteLink,
          },
          {
            text: "Reelni ko'rish",
            url: permalink,
          },
        ],
      });
    }

    await this.mediaRequestRepository.updateStatus({
      id: request.id,
      status: 'POSTED',
      instagramMediaId,
      errorReason: null,
    });
  }

  async execute(input: ProcessMediaRequestInput): Promise<void> {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        await this.processOnce(input.requestId);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < this.maxAttempts) {
          const backoffMs = 500 * 2 ** (attempt - 1);
          await sleep(backoffMs);
          continue;
        }
      }
    }

    const errorReason = toErrorReason(lastError);

    await this.mediaRequestRepository.updateStatus({
      id: input.requestId,
      status: 'FAILED',
      errorReason,
    });

    await this.processingFailureRepository.record({
      jobName: FETCH_MEDIA_REQUEST_JOB_NAME,
      payload: {
        requestId: input.requestId,
      },
      errorReason,
      retryCount: this.maxAttempts,
    });
  }
}
