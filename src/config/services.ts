export const services = {
    users: process.env.USERS_SERVICE_URL ?? 'http://localhost:4001',
    catalog: process.env.CATALOG_SERVICE_URL ?? 'http://localhost:4002',
    // add more as they appear
};
