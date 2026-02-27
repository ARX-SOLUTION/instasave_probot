import type { Express, Request, Response } from 'express';

export function registerHealthRoutes(app: Express): void {
  app.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  app.get('/readyz', (_req: Request, res: Response) => {
    res.status(200).json({ ready: true });
  });
}
