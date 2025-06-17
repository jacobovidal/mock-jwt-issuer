# Mock JWT Issuer

This is a simple mock server that simulates an OAuth2 Authorization Server for issuing signed JWT access tokens. It supports both Bearer and DPoP-bound tokens and exposes a simple JWKS endpoint.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjacobovidal%2Fmock-jwt-issuer)


## Table of Contents
<!-- no toc -->
- [Routes](#routes)
  - [`GET` /.well-known/jwks.json](#get-well-knownjwksjson)
  - [`POST` /jwt/sign](#post-jwtsign)
    - [DPoP-bound access token](#dpop-bound-access-token)
- [Key Pair](#key-pair)
- [Live Demo](https://auth.playground.oauthlabs.com/.well-known/jwks.json)

## Routes

### `GET` /.well-known/jwks.json

Returns the public JSON Web Key Set (JWKS) containing the public key used to verify signed JWTs.

### `POST` /jwt/sign

Generates a signed JWT access token.

You can provide any valid JWT claims in the body. Some fields are optional; defaults will be applied if omitted:

| Claim   | Description             | Default value             |
| ------- | ----------------------- | ------------------------- |
| `iss`   | Issuer                  | Request host              |
| `sub`   | Subject                 | Random UUID               |
| `aud`   | Audience                | `https://api.playground.oauthlabs.com` |
| `nbf`   | Not Before (UNIX time)  | Current time              |
| `iat`   | Issued At (UNIX time)   | Current time              |
| `exp`   | Expiration (UNIX time)  | 1 hour from now           |

> [!NOTE]
> You may include any additional claims in the request payload. All fields provided in the body will be embedded directly into the resulting JWT payload.

Example:

```bash
curl -X POST https://auth.playground.oauthlabs.com/jwt/sign
```

Response:

```json
{
  "token_type": "Bearer",
  "expires_in": 3600,
  "access_token": "eyJhbGciOiJFUzI1NiIsInR5cCI6..."
}
```

Example including `scope` claim:

```bash
curl -X POST https://auth.playground.oauthlabs.com/jwt/sign \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "read:profile write:profile"
  }'
```

Response:

```json
{
  "token_type": "Bearer",
  "scope": "read:profile write:profile",
  "expires_in": 3600,
  "access_token": "eyJhbGciOiJFUzI1NiIsInR5cCI6..."
}
```

#### DPoP-bound access token

To generate a DPoP-bound access token, include the `cnf.jkt` field (the base64url-encoded SHA-256 JWK thumbprint of the DPoP public key).

Example:

```bash
curl -X POST https://auth.playground.oauthlabs.com/jwt/sign \
  -H "Content-Type: application/json" \
  -d '{
    "cnf": {
      "jkt": "your-dpop-public-key-thumbprint"
    }
  }'

```

Response:

```json
{
  "token_type": "DPoP",
  "expires_in": 3600,
  "access_token": "eyJhbGciOiJFUzI1NiIsInR5cCI6..."
}
```

> [!NOTE]
> This only simulates the issuance of DPoP-bound access tokens. The server does not validate DPoP proofs or keys — it's only embedding the `cnf.jkt` claim into the token.

> [!TIP]
> You can use libraries like [`oauth-fetch`](https://www.npmjs.com/package/oauth-fetch) that simplify making request to DPoP-protected resources and provide utilities to generate the DPoP key pair.

Example using `oauth-fetch`:

```javascript
import { OAuthFetch, DPoPUtils } from "oauth-fetch";

const dpopKeyPair = await DPoPUtils.generateKeyPair();
const jwkThumbprint = await DPoPUtils.calculateJwkThumbprint(dpopKeyPair.publicKey);

const client = new OAuthFetch({
  baseUrl: "https://auth.playground.oauthlabs.com",
  isProtected: false,
});

await client.post("/jwt/sign", {
  cnf: {
    jkt: jwkThumbprint,
  }
});
```

## Key Pair

The server loads the key pair from:

- `/api/keys/private-key.json` — private JWK used for signing
- `/api/keys/public-key.json` — public JWK exposed in JWKS endpoint

You can generate your own key pair using libraries such as `jose` or just using the following npm command:

```bash
npm run generate-keypair
```
