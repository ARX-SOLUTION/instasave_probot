import type { SaveReelLinkUseCase } from '../../application/usecases/save-reel-link.usecase';
import type { IngestTelegramVideoUseCase } from '../../application/usecases/ingest-telegram-video.usecase';
import type { SearchInlineReelsUseCase } from '../../application/usecases/search-inline-reels.usecase';
import type { EnqueueMediaRequestFetchUseCase } from '../../application/usecases/enqueue-media-request-fetch.usecase';
import type { SetTargetChatUseCase } from '../../application/usecases/admin/set-target-chat.usecase';
import type { GetStatsUseCase } from '../../application/usecases/admin/get-stats.usecase';
import type { BanUserUseCase } from '../../application/usecases/admin/ban-user.usecase';
import type { UnbanUserUseCase } from '../../application/usecases/admin/unban-user.usecase';
import type { BannedUserRepository } from '../../domain/repositories/banned-user-repository';
import type { Env } from '../../infrastructure/config/env';

export interface TelegramHandlersDeps {
  env: Env;
  saveReelLinkUseCase: SaveReelLinkUseCase;
  enqueueMediaRequestFetchUseCase: EnqueueMediaRequestFetchUseCase;
  ingestTelegramVideoUseCase: IngestTelegramVideoUseCase;
  searchInlineReelsUseCase: SearchInlineReelsUseCase;
  setTargetChatUseCase: SetTargetChatUseCase;
  getStatsUseCase: GetStatsUseCase;
  banUserUseCase: BanUserUseCase;
  unbanUserUseCase: UnbanUserUseCase;
  bannedUserRepository: BannedUserRepository;
}
