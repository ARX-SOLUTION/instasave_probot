import type { Express } from 'express';

import type { MetaWebhookController } from '../controllers/meta-webhook.controller';

export function registerWebhookRoutes(app: Express, controller: MetaWebhookController): void {
  app.get('/webhooks/meta/instagram', (req, res) => {
    void controller.verify(req, res);
  });

  app.post('/webhooks/meta/instagram', (req, res) => {
    void controller.handle(req, res);
  });
}
