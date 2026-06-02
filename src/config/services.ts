/**
 * Logical downstream service registry for the API gateway.
 *
 * Auth and Users are separate gateway domains even when they point to the same
 * physical backend during local development. Keeping separate logical URLs now
 * lets us split the downstream services later without changing route code.
 */

/**
 * Base URLs for downstream services.
 *
 * `USER_AUTH_SERVICE_URL` and `USER_SERVICE_URL` are compatibility fallbacks
 * for older `.env` files. Prefer the domain-specific variables for new config:
 * `AUTH_SERVICE_URL`, `USERS_SERVICE_URL`, `FORUM_SERVICE_URL`, and
 * `AI_SERVICE_URL`.
 */
export const services = {
  auth: process.env.AUTH_SERVICE_URL ?? process.env.USER_AUTH_SERVICE_URL ?? process.env.USER_SERVICE_URL ?? 'http://localhost:4001',
  users: process.env.USERS_SERVICE_URL ?? process.env.USER_AUTH_SERVICE_URL ?? process.env.USER_SERVICE_URL ?? 'http://localhost:4001',
  forum: process.env.FORUM_SERVICE_URL ?? 'http://localhost:4002',
  catalog: process.env.CATALOG_SERVICE_URL ?? process.env.FORUM_SERVICE_URL ?? 'http://localhost:4002',
  ai: process.env.AI_SERVICE_URL ?? 'http://localhost:4003',
};
