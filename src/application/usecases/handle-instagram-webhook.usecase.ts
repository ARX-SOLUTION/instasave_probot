import type { InstagramPort } from '../ports/instagram.port';
import type { DomainEventBusPort } from '../ports/domain-event-bus.port';
import type { InstagramMediaRepository } from '../../domain/repositories/instagram-media-repository';
import {
  createInstagramReelReceivedEvent,
  type InstagramReelReceivedEvent,
} from '../../domain/events/instagram-reel-received.event';
import { parseInstagramWebhookPayload } from '../dto/instagram-webhook.dto';

export interface HandleInstagramWebhookOutput {
  totalChanges: number;
  processedReels: number;
  skippedNonReels: number;
  failed: number;
  eventsPublished: number;
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

export class HandleInstagramWebhookUseCase {
  constructor(
    private readonly instagramPort: InstagramPort,
    private readonly instagramMediaRepository: InstagramMediaRepository,
    private readonly eventBus: DomainEventBusPort,
  ) {}

  async execute(payload: unknown): Promise<HandleInstagramWebhookOutput> {
    const parsedPayload = parseInstagramWebhookPayload(payload);

    if (parsedPayload.object !== 'instagram') {
      return {
        totalChanges: 0,
        processedReels: 0,
        skippedNonReels: 0,
        failed: 0,
        eventsPublished: 0,
      };
    }

    let processedReels = 0;
    let skippedNonReels = 0;
    let failed = 0;
    let eventsPublished = 0;

    for (const change of parsedPayload.mediaChanges) {
      try {
        const media = await this.instagramPort.getMediaById(change.mediaId);
        if (!isReelMedia(media.mediaType, media.productType)) {
          skippedNonReels += 1;
          continue;
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

        processedReels += 1;

        const domainEvent: InstagramReelReceivedEvent = createInstagramReelReceivedEvent({
          instagramMediaRowId: savedMedia.id,
          mediaId: savedMedia.mediaId,
          mediaType: savedMedia.mediaType,
          productType: savedMedia.productType,
          permalink: savedMedia.permalink,
          mediaUrl: savedMedia.mediaUrl,
          caption: savedMedia.caption,
          timestamp: savedMedia.timestamp ? savedMedia.timestamp.toISOString() : null,
        });

        await this.eventBus.publish(domainEvent);
        eventsPublished += 1;
      } catch {
        failed += 1;
      }
    }

    return {
      totalChanges: parsedPayload.mediaChanges.length,
      processedReels,
      skippedNonReels,
      failed,
      eventsPublished,
    };
  }
}
