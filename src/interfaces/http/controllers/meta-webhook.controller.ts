import type { Request, Response } from 'express';
import { ZodError } from 'zod';

import type { HandleInstagramWebhookUseCase } from '../../../application/usecases/handle-instagram-webhook.usecase';
import type { Env } from '../../../infrastructure/config/env';
import { verifyMetaSignature } from '../../../infrastructure/http/meta-signature';
import { logger } from '../../../infrastructure/logging/logger';

type RequestWithRawBody = Request & { rawBody?: Buffer };

interface MetaWebhookControllerDeps {
  env: Env;
  handleInstagramWebhookUseCase: HandleInstagramWebhookUseCase;
}

export interface MetaWebhookController {
  verify: (req: Request, res: Response) => Promise<void>;
  handle: (req: RequestWithRawBody, res: Response) => Promise<void>;
}

export function createMetaWebhookController(deps: MetaWebhookControllerDeps): MetaWebhookController {
  return {
    verify: async (req: Request, res: Response): Promise<void> => {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const isValidRequest =
        mode === 'subscribe' &&
        typeof token === 'string' &&
        token === deps.env.META_VERIFY_TOKEN &&
        typeof challenge === 'string';

      if (!isValidRequest) {
        res.sendStatus(403);
        return;
      }

      res.status(200).send(challenge);
    },

    handle: async (req: RequestWithRawBody, res: Response): Promise<void> => {
      const signatureHeader = req.header('x-hub-signature-256') ?? undefined;
      const verified = verifyMetaSignature(deps.env.META_APP_SECRET, req.rawBody, signatureHeader);

      if (!verified) {
        res.sendStatus(401);
        return;
      }

      try {
        const result = await deps.handleInstagramWebhookUseCase.execute(req.body);
        if (result.failed > 0) {
          logger.warn({ result }, 'Meta webhook processed with failed media records');
        }
        logger.info({ result }, 'Processed Meta webhook payload');
        res.status(200).json({ received: true, ...result });
      } catch (error) {
        if (error instanceof ZodError) {
          res.status(400).json({ error: 'invalid_webhook_payload' });
          return;
        }

        logger.error({ err: error }, 'Unhandled error while handling Meta webhook');
        res.status(500).json({ error: 'webhook_processing_failed' });
      }
    },
  };
}
