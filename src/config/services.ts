export const services = {
  auth: process.env.AUTH_SERVICE_URL ?? process.env.USER_AUTH_SERVICE_URL ?? process.env.USER_SERVICE_URL ?? 'http://localhost:4001',
  users: process.env.USERS_SERVICE_URL ?? process.env.USER_AUTH_SERVICE_URL ?? process.env.USER_SERVICE_URL ?? 'http://localhost:4001',
  forum: process.env.FORUM_SERVICE_URL ?? 'http://localhost:4002',
  catalog: process.env.CATALOG_SERVICE_URL ?? process.env.FORUM_SERVICE_URL ?? 'http://localhost:4002',
  ai: process.env.AI_SERVICE_URL ?? 'http://localhost:4003',
};
