# Express TS API Gateway Boilerplate

🚀 **API Gateway на Express 5 + TypeScript**for microservice architecture.  
The project includes authentication (JWT), RBAC, mock user repository, EventBus mocking, Swagger UI integration and microservices proxies.
## 📦 Features
- [x] Express 5 + TypeScript
- [x] JWT authentication + logout (revocation)
- [x] RBAC: roles and permissions
- [x] Mock users (JSON) for tests
- [x] Events via in-memory EventBus
- [x] Proxy via [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) with `pathRewrite` support
- [x] OpenAPI (Swagger UI) на `/api/docs`
- [x] Tests: [Vitest](https://vitest.dev/) + [Supertest](https://github.com/ladjs/supertest)
- [x] ESLint 9 (flat config) + Prettier

## 🛠️ Getting Started

```bash
# install deps
npm install

# dev server
npm run dev

# build
npm run build
npm start

# lint & format
npm run lint
npm run lint:fix
npm run format

# test
npm run test
