export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface EncryptedData {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
}

export interface RecoveryBundle {
  encryptedPrivateKey: string; // base64
  nonce: string; // base64
  salt: string; // base64
  params: { opslimit: number; memlimit: number; alg: number };
}
