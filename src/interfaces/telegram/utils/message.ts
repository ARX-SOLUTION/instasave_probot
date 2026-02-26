import type { Context } from 'telegraf';

interface VideoPayload {
  file_id: string;
  file_unique_id: string;
  mime_type?: string;
  file_size?: number;
  duration?: number;
}

interface VideoMessageLike {
  message_id: number;
  video: VideoPayload;
}

const REEL_LINK_PATTERN = /https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/reel\/[A-Za-z0-9_-]+(?:\/|\b)[^\s]*/i;

function sanitizeUrl(input: string): string {
  return input.replace(/[),.!?]+$/g, '');
}

export function getMessageTextOrCaption(ctx: Context): string | null {
  const message = ctx.message;
  if (!message) {
    return null;
  }

  if ('text' in message && typeof message.text === 'string') {
    return message.text;
  }

  if ('caption' in message && typeof message.caption === 'string') {
    return message.caption;
  }

  return null;
}

export function extractReelLink(text: string): string | null {
  const match = text.match(REEL_LINK_PATTERN);
  return match ? sanitizeUrl(match[0]) : null;
}

export function isGroupChat(chatType: string | undefined): boolean {
  return chatType === 'group' || chatType === 'supergroup';
}

export function getVideoMessage(ctx: Context): VideoMessageLike | null {
  const message = ctx.message;
  if (!message) {
    return null;
  }

  if ('video' in message) {
    return message as VideoMessageLike;
  }

  return null;
}
