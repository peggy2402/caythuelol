import * as crypto from 'crypto';

/**
 * Multi-layer encryption utility for sensitive credentials (e.g. Riot API Key, payment secrets).
 * Layer 1: AES-256-GCM (Authenticated Encryption with Associated Data).
 * Layer 2: AES-256-CBC with HMAC-SHA256 signature verification.
 */

const ALGORITHM_GCM = 'aes-256-gcm';
const ALGORITHM_CBC = 'aes-256-cbc';
const ENC_PREFIX = 'ENC:v2:';

// Secret salt & master passphrase
const MASTER_SECRET =
  process.env.ENCRYPTION_SECRET ||
  process.env.JWT_SECRET ||
  'caythuelol-riot-secure-vault-key-2025-prod';

const SALT_GCM = 'leorank-gcm-salt-98765';
const SALT_CBC = 'leorank-cbc-salt-12345';
const SALT_HMAC = 'leorank-hmac-salt-54321';

// Derive distinct 256-bit keys for each layer
const KEY_GCM = crypto.scryptSync(MASTER_SECRET, SALT_GCM, 32);
const KEY_CBC = crypto.scryptSync(MASTER_SECRET, SALT_CBC, 32);
const KEY_HMAC = crypto.scryptSync(MASTER_SECRET, SALT_HMAC, 32);

/**
 * Checks whether a given string is already encrypted with our multi-layer format.
 */
export function isEncrypted(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  return value.startsWith(ENC_PREFIX);
}

/**
 * Encrypts a plaintext secret through 2 independent cryptographic layers:
 * Layer 1 (Inner): AES-256-GCM with 12-byte IV and 16-byte Auth Tag.
 * Layer 2 (Outer): AES-256-CBC with 16-byte IV and HMAC-SHA256 integrity tag.
 */
export function encryptSecret(plainText: string): string {
  if (!plainText || typeof plainText !== 'string') return '';
  const trimmed = plainText.trim();
  if (!trimmed) return '';

  // Already encrypted? Do not double-encrypt
  if (isEncrypted(trimmed)) return trimmed;

  try {
    // --- LAYER 1: AES-256-GCM ---
    const ivGcm = crypto.randomBytes(12);
    const cipherGcm = crypto.createCipheriv(ALGORITHM_GCM, KEY_GCM, ivGcm);
    const encryptedL1 = Buffer.concat([
      cipherGcm.update(trimmed, 'utf8'),
      cipherGcm.final(),
    ]);
    const authTagGcm = cipherGcm.getAuthTag();

    // Package Layer 1 payload: ivGcm (12) + authTagGcm (16) + encryptedL1
    const payloadL1 = JSON.stringify({
      iv: ivGcm.toString('hex'),
      tag: authTagGcm.toString('hex'),
      data: encryptedL1.toString('base64'),
    });

    // --- LAYER 2: AES-256-CBC ---
    const ivCbc = crypto.randomBytes(16);
    const cipherCbc = crypto.createCipheriv(ALGORITHM_CBC, KEY_CBC, ivCbc);
    const encryptedL2 = Buffer.concat([
      cipherCbc.update(payloadL1, 'utf8'),
      cipherCbc.final(),
    ]);

    // HMAC of outer ciphertext for extra defense-in-depth
    const hmac = crypto.createHmac('sha256', KEY_HMAC);
    hmac.update(ivCbc);
    hmac.update(encryptedL2);
    const hmacDigest = hmac.digest('hex');

    const envelope = {
      iv: ivCbc.toString('hex'),
      mac: hmacDigest,
      payload: encryptedL2.toString('base64'),
    };

    return `${ENC_PREFIX}${Buffer.from(JSON.stringify(envelope)).toString('base64')}`;
  } catch (error) {
    console.error('Failed to encrypt secret:', error);
    throw new Error('Encryption error');
  }
}

/**
 * Decrypts a multi-layered encrypted string back to plaintext.
 * Returns the original value if it is not encrypted (backward compatibility).
 */
export function decryptSecret(cipherText?: string | null): string {
  if (!cipherText || typeof cipherText !== 'string') return '';
  const trimmed = cipherText.trim();
  if (!trimmed) return '';

  // If not encrypted with our prefix, return as is (legacy unencrypted)
  if (!isEncrypted(trimmed)) {
    return trimmed;
  }

  try {
    const rawPayload = trimmed.slice(ENC_PREFIX.length);
    const envelopeJson = Buffer.from(rawPayload, 'base64').toString('utf8');
    const envelope = JSON.parse(envelopeJson);

    const ivCbc = Buffer.from(envelope.iv, 'hex');
    const encryptedL2 = Buffer.from(envelope.payload, 'base64');

    // Verify HMAC
    const hmac = crypto.createHmac('sha256', KEY_HMAC);
    hmac.update(ivCbc);
    hmac.update(encryptedL2);
    const calculatedMac = hmac.digest('hex');

    if (calculatedMac !== envelope.mac) {
      console.error('Secret HMAC verification failed: Potential tampering detected!');
      return '';
    }

    // --- DECRYPT LAYER 2 (CBC) ---
    const decipherCbc = crypto.createDecipheriv(ALGORITHM_CBC, KEY_CBC, ivCbc);
    const decryptedL1Str = Buffer.concat([
      decipherCbc.update(encryptedL2),
      decipherCbc.final(),
    ]).toString('utf8');

    const payloadL1 = JSON.parse(decryptedL1Str);
    const ivGcm = Buffer.from(payloadL1.iv, 'hex');
    const authTagGcm = Buffer.from(payloadL1.tag, 'hex');
    const encryptedL1 = Buffer.from(payloadL1.data, 'base64');

    // --- DECRYPT LAYER 1 (GCM) ---
    const decipherGcm = crypto.createDecipheriv(ALGORITHM_GCM, KEY_GCM, ivGcm);
    decipherGcm.setAuthTag(authTagGcm);

    const decryptedFinal = Buffer.concat([
      decipherGcm.update(encryptedL1),
      decipherGcm.final(),
    ]).toString('utf8');

    return decryptedFinal;
  } catch (error) {
    console.error('Failed to decrypt secret:', error);
    return '';
  }
}
