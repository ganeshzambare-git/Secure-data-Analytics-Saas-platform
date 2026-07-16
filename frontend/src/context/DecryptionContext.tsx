"use client";

/**
 * DecryptionContext.tsx — Client-Side AES-256-GCM Decryption Context
 * ReadyNest Analytics Engine — Phase 3
 *
 * Mirrors the backend crypto_service.py wire format:
 *   hex(iv[12] + ciphertext_with_gcm_tag)
 *
 * Decryption is performed entirely in volatile memory via the Web Crypto
 * API (window.crypto.subtle). Decrypted values are NEVER written to
 * localStorage, the DOM, or any logging system.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────

interface DecryptionContextType {
  /** Decrypt a hex-encoded AES-256-GCM payload from the server. */
  decryptPayload: (hexPayload: string) => Promise<unknown>;
}

// ── Context ───────────────────────────────────────────────────────────

const DecryptionContext = createContext<DecryptionContextType | undefined>(
  undefined
);

// ── Key derivation ────────────────────────────────────────────────────

/** Must match backend _derive_key(): pad/truncate to exactly 32 bytes. */
async function importAesKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  let keyBytes = encoder.encode(secret);

  if (keyBytes.length < 32) {
    const padded = new Uint8Array(32);
    padded.set(keyBytes);
    keyBytes = padded;
  } else if (keyBytes.length > 32) {
    keyBytes = keyBytes.slice(0, 32);
  }

  return window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,           // non-extractable — key cannot be read back from memory
    ["decrypt"]
  );
}

// ── Provider ──────────────────────────────────────────────────────────

export const DecryptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Lazy key reference — only imported on the first client-side decrypt call.
  // Kept in a ref (not state) so it never appears in React DevTools.
  const keyRef = useRef<Promise<CryptoKey> | null>(null);

  const getKey = useCallback((): Promise<CryptoKey> => {
    if (!keyRef.current) {
      const secret =
        process.env.NEXT_PUBLIC_AES_SECRET_KEY ||
        "y3K9xP2wL4mN7qR1sT8uV5wX0zA3bC6d";
      keyRef.current = importAesKey(secret);
    }
    return keyRef.current;
  }, []);

  const decryptPayload = useCallback(
    async (hexPayload: string): Promise<unknown> => {
      // Decode hex → Uint8Array
      const raw = new Uint8Array(
        hexPayload.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      );

      // Split IV (12 bytes) + ciphertext+tag
      const iv = raw.slice(0, 12);
      const ctWithTag = raw.slice(12);

      const cryptoKey = await getKey();

      // Decrypt in volatile memory
      const plaintextBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        ctWithTag
      );

      const plaintext = new TextDecoder().decode(plaintextBuffer);

      // SECURITY: never log decrypted values
      return JSON.parse(plaintext);
    },
    [getKey]
  );

  return (
    <DecryptionContext.Provider value={{ decryptPayload }}>
      {children}
    </DecryptionContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────

export const useDecryption = (): DecryptionContextType => {
  const ctx = useContext(DecryptionContext);
  if (!ctx) {
    throw new Error(
      "useDecryption must be used within a DecryptionProvider."
    );
  }
  return ctx;
};
