import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyMetaSignature(
  appSecret: string,
  rawBody: Buffer | undefined,
  signatureHeader: string | undefined,
): boolean {
  if (!rawBody || !signatureHeader) {
    return false;
  }

  const [algorithm, providedSignature] = signatureHeader.split('=');
  if (algorithm !== 'sha256' || !providedSignature) {
    return false;
  }

  const expectedSignature = createHmac('sha256', appSecret).update(rawBody).digest('hex');

  const providedBuffer = Buffer.from(providedSignature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
