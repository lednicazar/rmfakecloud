const ALGORITHM = "AES-GCM";
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

function isSecureContext() {
  return typeof crypto !== "undefined" && crypto.subtle != null;
}

function getEncryptionKey() {
  const userStr = localStorage.getItem("currentUser");
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.UserID || user.email || "default";
  } catch {
    return "default";
  }
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptToken(plaintext) {
  if (!plaintext) return "";
  if (!isSecureContext()) return plaintext;
  const password = getEncryptionKey();
  if (!password) return plaintext;

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    enc.encode(plaintext)
  );

  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptToken(ciphertext) {
  if (!ciphertext) return "";
  if (!isSecureContext()) return ciphertext;
  const password = getEncryptionKey();
  if (!password) return ciphertext;

  try {
    const data = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    const salt = data.slice(0, SALT_LENGTH);
    const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = data.slice(SALT_LENGTH + IV_LENGTH);

    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return ciphertext;
  }
}
