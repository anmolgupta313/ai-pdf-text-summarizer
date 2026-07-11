
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX = process.env.ENCRYPTION_KEY; // must be 64 hex chars = 32 bytes

function getKey() {
  if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string in .env.local. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(KEY_HEX, "hex");
}

/**
 * Encrypts a plaintext string.
 * Returns a single string: "iv:authTag:ciphertext" (all hex encoded)
 * Safe to store directly in any MongoDB string field.
 */
export function encrypt(plaintext) {
  if (!plaintext) return plaintext; // don't encrypt empty/null values

  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag(); // 128-bit authentication tag

  // Store as "iv:authTag:ciphertext" — all the info needed to decrypt
  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

/**
 * Decrypts a string produced by encrypt().
 * Returns the original plaintext string.
 */
export function decrypt(encryptedString) {
  if (!encryptedString) return encryptedString;

  // If the value doesn't look encrypted (e.g. legacy plain data), return as-is
  const parts = encryptedString.split(":");
  if (parts.length !== 3) return encryptedString;

  const [ivHex, authTagHex, ciphertextHex] = parts;

  try {
    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const ciphertext = Buffer.from(ciphertextHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (err) {
    console.error("[decrypt] Failed — data may be corrupted or key is wrong:", err.message);
    return null;
  }
}

/**
 * Encrypts every string field in an object that you specify.
 * Usage: encryptFields({ text: "hello", title: "world" }, ["text", "title"])
 */
export function encryptFields(obj, fields) {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field]) result[field] = encrypt(result[field]);
  }
  return result;
}

/**
 * Decrypts every string field in an object that you specify.
 */
export function decryptFields(obj, fields) {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field]) result[field] = decrypt(result[field]);
  }
  return result;
}
