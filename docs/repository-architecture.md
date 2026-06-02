# Repository Architecture

This gateway uses repositories as a boundary between services and data sources.
Services should call repository contracts or the current compatibility facade,
not instantiate concrete repositories directly.

## Current Shape

```text
src/repositories/
  index.ts
  usersRepo.ts
  auth/
    AuthRepository.ts
    AuthMockRepository.ts
  users/
    UsersRepository.ts
    UsersMockRepository.ts
```

## Composition Root

`src/repositories/index.ts` is the repository composition root.

It creates repository instances once:

```ts
const auth = new AuthMockRepository();
const users = new UsersMockRepository(auth);

export const repositories = { auth, users };
```

`UsersMockRepository` receives the auth repository dependency through its
constructor so user state changes can update related auth mock state without
creating hidden singleton coupling.

## Contracts

Repository contracts live beside their domain implementations:

- `src/repositories/auth/AuthRepository.ts`
- `src/repositories/users/UsersRepository.ts`

These files define the methods and DTO types that services and future
implementations should agree on.

## Implementations

Current implementations are mock repositories:

- `AuthMockRepository`
- `UsersMockRepository`

They read from `mock-data/` and model expected downstream service responses
while Python services are still under development.

Do not add environment-specific folders like `dev/` or `prod/`. Add new
implementations by domain when needed, for example an auth HTTP repository
beside the auth contract.

## Compatibility Facade

`src/repositories/usersRepo.ts` is still kept as a compatibility facade.

It currently decides between:

- mock repositories through `repositories`
- remote Python client functions when mock mode is disabled

This keeps services stable while the gateway architecture is being cleaned up.
When the next repository implementation is ready, this facade can be narrowed
or renamed without changing public API response shapes.

## Service Rule

Controllers should not import repositories.

Services should avoid importing concrete repository classes. They should use:

- `repositories` from `src/repositories`
- or the temporary `usersRepo.ts` facade while it remains in place

Concrete repository classes should normally only be imported by the composition
root or tests that explicitly need to instantiate them.

## Mock Data Ownership

Auth mock repository reads:

- `mock-data/auth/auth-users.json`
- `mock-data/auth/auth-me.json`
- `mock-data/auth/auth-sessions.json`

Users mock repository reads:

- `mock-data/users/user-list-items.json`
- `mock-data/users/user-profiles.json`
- `mock-data/users/admin-details.json`

The gateway should preserve public API response shapes regardless of whether
data comes from mock files or future downstream services.
