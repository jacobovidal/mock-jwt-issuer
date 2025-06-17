import { generateKeyPair, exportJWK, calculateJwkThumbprint } from "jose";
import { writeFileSync } from "node:fs";

async function generateAndSaveKeyPair() {
  const { publicKey, privateKey } = await generateKeyPair("RS256", {
    extractable: true,
  });

  const publicJwk = await exportJWK(publicKey);
  publicJwk.use = "sig";
  publicJwk.alg = "RS256";
  publicJwk.kid = await calculateJwkThumbprint(publicJwk);
  writeFileSync("./api/keys/public-key.json", JSON.stringify(publicJwk, null, 2));

  const privateJwk = await exportJWK(privateKey);
  privateJwk.use = "sig";
  privateJwk.alg = "RS256";
  privateJwk.kid = publicJwk.kid;
  writeFileSync(
    "./api/keys/private-key.json",
    JSON.stringify(privateJwk, null, 2)
  );
}

generateAndSaveKeyPair();
