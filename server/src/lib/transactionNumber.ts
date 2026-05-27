import crypto from 'node:crypto';

// Format: TRX-YYYYMMDD-HHmmss-XXXX (XXXX = 4 hex chars)
export const generateTransactionNumber = (prefix = 'TRX'): string => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${date}-${time}-${rand}`;
};
