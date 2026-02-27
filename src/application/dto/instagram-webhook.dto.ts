import { z } from 'zod';

export interface InstagramWebhookMediaChange {
  field: string;
  mediaId: string;
  raw: Record<string, unknown>;
}

export interface ParsedInstagramWebhookPayload {
  object: string;
  mediaChanges: InstagramWebhookMediaChange[];
}

const webhookSchema = z
  .object({
    object: z.string(),
    entry: z
      .array(
        z
          .object({
            changes: z
              .array(
                z
                  .object({
                    field: z.string(),
                    value: z.record(z.string(), z.unknown()).nullable().optional(),
                  })
                  .passthrough(),
              )
              .default([]),
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();

function extractMediaId(value: Record<string, unknown> | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const byMediaId = value.media_id;
  if (typeof byMediaId === 'string' && byMediaId.trim().length > 0) {
    return byMediaId;
  }

  const byId = value.id;
  if (typeof byId === 'string' && byId.trim().length > 0) {
    return byId;
  }

  return null;
}

export function parseInstagramWebhookPayload(payload: unknown): ParsedInstagramWebhookPayload {
  const parsed = webhookSchema.parse(payload);
  const uniqueMediaChanges = new Map<string, InstagramWebhookMediaChange>();

  for (const entry of parsed.entry) {
    for (const change of entry.changes) {
      const mediaId = extractMediaId(change.value);
      if (!mediaId) {
        continue;
      }

      if (change.field !== 'media') {
        continue;
      }

      uniqueMediaChanges.set(mediaId, {
        field: change.field,
        mediaId,
        raw: change.value ?? {},
      });
    }
  }

  return {
    object: parsed.object,
    mediaChanges: Array.from(uniqueMediaChanges.values()),
  };
}
