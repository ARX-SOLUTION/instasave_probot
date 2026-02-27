import type { BotConfigRepository } from '../../../domain/repositories/bot-config-repository';

const TARGET_CHAT_KEY = 'target_chat_id';

export class SetTargetChatUseCase {
  constructor(private readonly botConfigRepository: BotConfigRepository) {}

  async execute(chatId: string): Promise<void> {
    await this.botConfigRepository.setValue(TARGET_CHAT_KEY, { chatId });
  }
}
