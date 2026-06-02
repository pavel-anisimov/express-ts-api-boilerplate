import 'dotenv/config';

/**
 * Runtime environment configuration for the gateway.
 *
 * This module is the only place where raw `process.env` values should be
 * parsed into typed application settings. Keeping normalization here prevents
 * controllers, services, and repositories from depending on stringly env vars.
 */

/**
 * Duration values accepted by the JWT library and the local mock runtime.
 *
 * Examples: `500ms`, `30s`, `10m`, `1h`, `7d`.
 */
type MsLike = `${number}${'ms'|'s'|'m'|'h'|'d'}`;

/**
 * Parses a comma-separated environment variable into a list.
 *
 * Empty segments are removed so `CORS_ORIGINS=http://a,,http://b` behaves the
 * same as `CORS_ORIGINS=http://a,http://b`.
 */
function arr(v?: string) {
    return (v ?? '').split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Parses boolean-like environment values.
 *
 * Only explicit truthy values enable the flag. Missing, empty, or unknown
 * values fall back to the provided default, which keeps feature flags
 * predictable in local and test environments.
 */
function bool(v: string | undefined, fallback: boolean): boolean {
    const normalized = v?.trim().toLowerCase();
    if (!normalized) {
        return fallback;
    }

    return ['1', 'true', 'yes', 'on'].includes(normalized);
}

/**
 * Normalized gateway environment.
 *
 * Values are resolved once at module load and then imported as read-only
 * application configuration. Test mode defaults to mock data so CI and local
 * test runs do not require downstream Python services.
 */
export const env = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: Number(process.env.PORT ?? 3100),
    CORS_ORIGINS: arr(process.env.CORS_ORIGINS),
    JWT_SECRET: process.env.JWT_SECRET ?? 'dev_super_secret_change_me',
    JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN ?? '1h') as MsLike | number,

    ACCESS_TTL: (process.env.ACCESS_TTL ?? '1h') as MsLike | number,
    REFRESH_TTL: (process.env.REFRESH_TTL ?? '7d') as MsLike | number,
    MOCK_DATA_ENABLED: bool(process.env.MOCK_DATA_ENABLED ?? process.env.MOCK_DATA, process.env.NODE_ENV === 'test'),
 };
