export interface BannedUser {
  telegramUserId: string;
  reason: string | null;
  bannedBy: string | null;
  createdAt: Date;
}
