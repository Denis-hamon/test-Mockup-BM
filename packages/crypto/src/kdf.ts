import sodium from "libsodium-wrappers-sumo";

export async function generateSalt(): Promise<Uint8Array> {
  await sodium.ready;
  return sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
}

export async function deriveKey(
  password: Uint8Array | string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  await sodium.ready;
  const passwordBytes =
    typeof password === "string" ? sodium.from_string(password) : password;
  return sodium.crypto_pwhash(
    32,
    passwordBytes,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_MODERATE,
    sodium.crypto_pwhash_ALG_ARGON2ID13,
  );
}

// Export KDF constants for use in RecoveryBundle params
export let KDF_OPSLIMIT: number;
export let KDF_MEMLIMIT: number;
export let KDF_ALG: number;

// Initialize constants when sodium is ready
sodium.ready.then(() => {
  KDF_OPSLIMIT = sodium.crypto_pwhash_OPSLIMIT_MODERATE;
  KDF_MEMLIMIT = sodium.crypto_pwhash_MEMLIMIT_MODERATE;
  KDF_ALG = sodium.crypto_pwhash_ALG_ARGON2ID13;
});
