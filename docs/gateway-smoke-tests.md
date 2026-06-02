# Gateway Smoke Tests

Manual `curl` commands for checking the Express API Gateway in mock mode.

Base URL:

```bash
export API_BASE="http://localhost:3100"
```

## Start Gateway

Start the gateway with mock data enabled:

```bash
MOCK_DATA_ENABLED=true PORT=3100 npm run dev
```

Or, if `.env` already has `MOCK_DATA_ENABLED=true` and `PORT=3100`:

```bash
npm run dev
```

## Health

```bash
curl -i "$API_BASE/api/health"
```

Expected status: `200 OK`.

## Login

Known mock admin from `mock-data/auth/auth-users.json`:

- email: `admin1@example.com`
- password: `password`

```bash
curl -sS -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@example.com","password":"password"}'
```

Save the login response:

```bash
curl -sS -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@example.com","password":"password"}' \
  > /tmp/gateway-login.json
```

Extract tokens with `jq`:

```bash
export TOKEN="$(jq -r '.accessToken' /tmp/gateway-login.json)"
export REFRESH_TOKEN="$(jq -r '.refreshToken' /tmp/gateway-login.json)"
```

If `jq` is not installed, copy `accessToken` and `refreshToken` from `/tmp/gateway-login.json` manually:

```bash
export TOKEN="paste-access-token-here"
export REFRESH_TOKEN="paste-refresh-token-here"
```

Confirm the token is set:

```bash
printf 'TOKEN=%s...\n' "${TOKEN:0:24}"
```

## Authenticated Auth Routes

### Current User

```bash
curl -sS "$API_BASE/api/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

### Refresh Access Token

```bash
curl -sS -X POST "$API_BASE/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

To replace `TOKEN` with the refreshed token:

```bash
export TOKEN="$(
  curl -sS -X POST "$API_BASE/api/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" \
  | jq -r '.accessToken'
)"
```

### Update My Profile

```bash
curl -sS -X PATCH "$API_BASE/api/auth/me/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Admin One Smoke",
    "profile": {
      "bio": "Smoke test profile update",
      "timezone": "America/Los_Angeles",
      "language": "en",
      "location": {
        "city": "San Francisco",
        "state": "CA",
        "country": "USA",
        "zip": "94105"
      }
    },
    "preferences": {
      "theme": "dark",
      "notifications": {
        "email": true
      },
      "privacy": {
        "email": "private"
      }
    }
  }'
```

### Logout

```bash
curl -i -X POST "$API_BASE/api/auth/logout" \
  -H "Authorization: Bearer $TOKEN"
```

Expected status: `204 No Content`.

## Users Routes

These examples use the admin token from `admin1@example.com`.

### List Users

```bash
curl -sS "$API_BASE/api/users" \
  -H "Authorization: Bearer $TOKEN"
```

With pagination and search:

```bash
curl -sS "$API_BASE/api/users?page=1&limit=5&q=admin" \
  -H "Authorization: Bearer $TOKEN"
```

### Get User Profile

Admin profile:

```bash
curl -sS "$API_BASE/api/users/a1/profile" \
  -H "Authorization: Bearer $TOKEN"
```

Regular user profile:

```bash
curl -sS "$API_BASE/api/users/o2/profile" \
  -H "Authorization: Bearer $TOKEN"
```

### Soft Delete / Restore User

Soft delete a mock user:

```bash
curl -sS -X PATCH "$API_BASE/api/users/o2/deleted" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deleted":true}'
```
Note: mutating commands modify in-memory mock state during the current gateway process.
Restart the gateway to reset mock data, or run the restore/unsuspend examples after testing.

Restore the same mock user:

```bash
curl -sS -X PATCH "$API_BASE/api/users/o2/deleted" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deleted":false}'
```

### Suspend / Unsuspend User

Suspend a mock user:

```bash
curl -sS -X PATCH "$API_BASE/api/users/o3/suspended" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"suspended":true}'
```

Unsuspend the same mock user:

```bash
curl -sS -X PATCH "$API_BASE/api/users/o3/suspended" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"suspended":false}'
```

### Delete User

This route currently performs the gateway's existing delete behavior for a user id:

```bash
curl -sS -X DELETE "$API_BASE/api/users/o5" \
  -H "Authorization: Bearer $TOKEN"
```

## Quick Full Run

```bash
export API_BASE="http://localhost:3100"

curl -sS "$API_BASE/api/health"

curl -sS -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@example.com","password":"password"}' \
  > /tmp/gateway-login.json

export TOKEN="$(jq -r '.accessToken' /tmp/gateway-login.json)"
export REFRESH_TOKEN="$(jq -r '.refreshToken' /tmp/gateway-login.json)"

curl -sS "$API_BASE/api/auth/me" \
  -H "Authorization: Bearer $TOKEN"

curl -sS "$API_BASE/api/users?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"

curl -sS "$API_BASE/api/users/a1/profile" \
  -H "Authorization: Bearer $TOKEN"
```
