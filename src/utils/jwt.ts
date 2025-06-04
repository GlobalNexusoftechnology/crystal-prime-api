import jwt, { SignOptions } from "jsonwebtoken";
import config from "config";

/**
 * Signs a JWT token with the private key for either access or refresh tokens.
 * @param payload The payload of the JWT token
 * @param keyName The key name in config ('accessTokenPrivateKey' or 'refreshTokenPrivateKey')
 * @param options Optional sign options like expiration time
 * @returns The signed JWT token
 */
export const signJwt = (
  payload: object,
  keyName: "accessTokenPrivateKey" | "refreshTokenPrivateKey",
  options: SignOptions
): string => {
  // Decode the base64-encoded key and wrap it in PEM format
  const privateKeyBase64 = config.get<string>(keyName);

  const privateKey = Buffer.from(privateKeyBase64, "base64").toString("utf-8");

  return jwt.sign(payload, privateKey, {
    ...(options && options),
    algorithm: "HS256", // Use RSA algorithm for signing
  });
};

/**
 * Verifies a JWT token using the public key for either access or refresh tokens.
 * @param token The JWT token to verify
 * @param keyName The key name in config ('accessTokenPublicKey' or 'refreshTokenPublicKey')
 * @returns The decoded payload or null if verification fails
 */
export const verifyJwt = <T>(
  token: string,
  keyName: "accessTokenPublicKey" | "refreshTokenPublicKey"
): T | null => {
  try {
    // Decode the base64-encoded key and wrap it in PEM format
    const publicKeyBase64 = config.get<string>(keyName);
    const publicKey = Buffer.from(publicKeyBase64, "base64").toString("utf-8");

    // Verify the token using the public key
    const decoded = jwt.verify(token, publicKey) as T;
    return decoded;
  } catch (error) {
    console.error("JWT verification error:", error); // Log the error for debugging
    return null;
  }
};
