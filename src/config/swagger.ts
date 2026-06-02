import swaggerJSDoc from 'swagger-jsdoc';

/**
 * OpenAPI document generated from the gateway route annotations.
 *
 * The gateway serves every public route under `/api`, so the Swagger server URL
 * is relative to the mounted API prefix rather than a fixed host. Route files
 * remain the source of operation-level documentation.
 */
export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'API Gateway',
            version: '0.1.0',
            description: 'Express TS API Gateway',
        },
        servers: [{ url: '/api' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [
        // Route-level JSDoc blocks are collected from here.
        './src/routes/*.ts',
    ],
});
