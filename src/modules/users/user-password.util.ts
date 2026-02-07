import { createHash } from 'crypto';

export const DEFAULT_USER_PASSWORD = '1234';

export const buildDefaultPasswordHash = (): string => {
  const digest = createHash('md5').update(DEFAULT_USER_PASSWORD).digest('hex');
  return `md5:${digest}`;
};
