import express, { type Request, type Response } from 'express';
import pinoHttp from 'pino-http';

import { registerHealthRoutes } from '../../interfaces/http/routes/health.routes';
import { registerWebhookRoutes } from '../../interfaces/http/routes/webhook.routes';
import type { MetaWebhookController } from '../../interfaces/http/controllers/meta-webhook.controller';
import { logger } from '../logging/logger';

type RequestWithRawBody = Request & { rawBody?: Buffer };

interface CreateHttpAppOptions {
  metaWebhookController: MetaWebhookController;
}

export function createHttpApp(options: CreateHttpAppOptions): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(pinoHttp({ logger }));
  app.use(
    express.json({
      verify: (req, _res, buffer) => {
        (req as RequestWithRawBody).rawBody = Buffer.from(buffer);
      },
    }),
  );

  registerHealthRoutes(app);
  registerWebhookRoutes(app, options.metaWebhookController);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
