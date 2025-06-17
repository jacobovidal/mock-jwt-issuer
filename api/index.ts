import express from "express";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { SignJWT, importJWK } from "jose";
import type { JWK, JWTPayload } from "jose";
import type { BoundAccessToken } from "./types.js";

const DEFAULT_EXPIRATION = 60 * 60; // 1 hour
const DEFAULT_AUDIENCE = "https://api.playground.oauthlabs.com";

const app = express();

app.set("trust proxy", true);

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicRaw = await readFile(
  path.join(__dirname, "keys", "public-key.json"),
  "utf-8"
);
const privateRaw = await readFile(
  path.join(__dirname, "keys", "private-key.json"),
  "utf-8"
);

const publicJwk: JWK = JSON.parse(publicRaw);
const privateJwk: JWK = JSON.parse(privateRaw);

const privateKey = await importJWK(privateJwk, privateJwk.alg);

app.get("/.well-known/jwks.json", (_req, res) => {
  res.json({ keys: [publicJwk] });
});

app.post("/jwt/sign", async (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const defaultIssuer = `${req.protocol}://${req.get("host")}`;

    const body = (req.body as JWTPayload & Partial<BoundAccessToken>) || {};

    const {
      iss = defaultIssuer,
      sub = crypto.randomUUID(),
      aud = DEFAULT_AUDIENCE,
      nbf = now,
      iat = now,
      exp = now + DEFAULT_EXPIRATION,
      ...others
    } = body;

    const accessToken = await new SignJWT({ ...others })
      .setProtectedHeader({ alg: publicJwk.alg!, kid: publicJwk.kid })
      .setIssuedAt(iat)
      .setIssuer(iss)
      .setSubject(sub)
      .setAudience(aud)
      .setNotBefore(nbf)
      .setExpirationTime(exp)
      .sign(privateKey);

    res.json({
      token_type: body?.cnf?.jkt ? "DPoP" : "Bearer",
      scope: body?.scope,
      expires_in: exp - iat,
      access_token: accessToken,
    });
  } catch {
    res.status(500).json({
      error: "server_error",
      error_description: "There was an unknown error",
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({
    error: "not_found",
    error_description: "The requested resource was not found",
  });
});

export default app;
