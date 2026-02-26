import type { BannedUserRepository } from '../../../domain/repositories/banned-user-repository';

export class BanUserUseCase {
  constructor(private readonly bannedUserRepository: BannedUserRepository) {}

  async execute(userId: string, bannedBy: string | null, reason: string | null): Promise<void> {
    await this.bannedUserRepository.ban({
      telegramUserId: userId,
      reason,
      bannedBy,
      createdAt: new Date(),
    });
  }
}
