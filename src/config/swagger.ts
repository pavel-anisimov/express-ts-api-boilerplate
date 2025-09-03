import swaggerJSDoc from 'swagger-jsdoc';

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
        // You can include JSDoc comments from controllers/routes
        './src/routes/*.ts',
    ],
});
