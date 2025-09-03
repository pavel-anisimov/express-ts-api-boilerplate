import 'dotenv/config';

// "1h" and numbers will be supported by the type right away
type MsLike = `${number}${'ms'|'s'|'m'|'h'|'d'}`;

function arr(v?: string) {
    return (v ?? '').split(',').map(s => s.trim()).filter(Boolean);
}

export const env = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: Number(process.env.PORT ?? 3100),
    CORS_ORIGINS: arr(process.env.CORS_ORIGINS),
    JWT_SECRET: process.env.JWT_SECRET ?? 'change_me',
    JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN ?? '1h') as MsLike | number,
};