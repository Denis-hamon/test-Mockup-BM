import sodium from "libsodium-wrappers-sumo";

export interface ConversationKeys {
  rx: Uint8Array; // Key to decrypt received messages
  tx: Uint8Array; // Key to encrypt sent messages
}

/**
 * Derive conversation keys for the "client" role in the exchange.
 * The first user to create the conversation is the "client".
 * crypto_box_keypair keys are compatible with crypto_kx_* functions.
 */
export async function deriveClientKeys(
  myPublicKey: Uint8Array,
  mySecretKey: Uint8Array,
  theirPublicKey: Uint8Array,
): Promise<ConversationKeys> {
  await sodium.ready;
  const { sharedRx, sharedTx } = sodium.crypto_kx_client_session_keys(
    myPublicKey,
    mySecretKey,
    theirPublicKey,
  );
  return { rx: sharedRx, tx: sharedTx };
}

/**
 * Derive conversation keys for the "server" role in the exchange.
 * The second participant (responder) uses this.
 */
export async function deriveServerKeys(
  myPublicKey: Uint8Array,
  mySecretKey: Uint8Array,
  theirPublicKey: Uint8Array,
): Promise<ConversationKeys> {
  await sodium.ready;
  const { sharedRx, sharedTx } = sodium.crypto_kx_server_session_keys(
    myPublicKey,
    mySecretKey,
    theirPublicKey,
  );
  return { rx: sharedRx, tx: sharedTx };
}
