import type { DomainEvent } from './domain-event';

export const INSTAGRAM_REEL_RECEIVED_EVENT_NAME = 'instagram.reel.received';

export interface InstagramReelReceivedPayload {
  instagramMediaRowId: string;
  mediaId: string;
  mediaType: string;
  productType: string;
  permalink: string;
  mediaUrl: string | null;
  caption: string | null;
  timestamp: string | null;
}

export interface InstagramReelReceivedEvent extends DomainEvent<InstagramReelReceivedPayload> {
  name: typeof INSTAGRAM_REEL_RECEIVED_EVENT_NAME;
  payload: InstagramReelReceivedPayload;
}

export function createInstagramReelReceivedEvent(
  payload: InstagramReelReceivedPayload,
): InstagramReelReceivedEvent {
  return {
    name: INSTAGRAM_REEL_RECEIVED_EVENT_NAME,
    occurredAt: new Date(),
    payload,
  };
}
