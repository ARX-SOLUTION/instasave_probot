import type { BannedUserRepository } from '../../../domain/repositories/banned-user-repository';

export class UnbanUserUseCase {
  constructor(private readonly bannedUserRepository: BannedUserRepository) {}

  async execute(userId: string): Promise<void> {
    await this.bannedUserRepository.unban(userId);
  }
}
