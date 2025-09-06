import 'dotenv/config';

// "1h" and numbers will be supported by the type right away
type MsLike = `${number}${'ms'|'s'|'m'|'h'|'d'}`;

function arr(v?: string) {
    return (v ?? '').split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Configuration object for environment variables.
 *
 * @property {string} NODE_ENV - Represents the current running environment of the application (e.g., 'development', 'production'). Defaults to 'development' if not set.
 * @property {number} PORT - Port number on which the application will run. Defaults to 3100 if not specified in the environment variables.
 * @property {Array<string>} CORS_ORIGINS - List of allowed origins for Cross-Origin Resource Sharing (CORS). Extracted and parsed from the environment variable `CORS_ORIGINS`.
 * @property {string} JWT_SECRET - Secret key used for signing and verifying JSON Web Tokens (JWT). Defaults to 'change_me' if not explicitly specified.
 * @property {MsLike|number} JWT_EXPIRES_IN - Expiration duration for JWT. Can be a string or number. Defaults to '1h' if not set.
 */
export const env = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: Number(process.env.PORT ?? 3100),
    CORS_ORIGINS: arr(process.env.CORS_ORIGINS),
    JWT_SECRET: process.env.JWT_SECRET ?? 'dev_super_secret_change_me',
    JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN ?? '1h') as MsLike | number,

    ACCESS_TTL: (process.env.ACCESS_TTL ?? '1h') as MsLike | number,
    REFRESH_TTL: (process.env.REFRESH_TTL ?? '7d') as MsLike | number,
 };