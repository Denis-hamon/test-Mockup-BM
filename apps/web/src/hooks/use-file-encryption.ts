"use client";

import { useState, useCallback } from "react";
import { encrypt } from "@legalconnect/crypto";
import sodium from "libsodium-wrappers-sumo";
import { uploadEncryptedFile } from "@/server/actions/upload.actions";

/** Maximum file size: 50 MB */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Maximum total upload size: 200 MB */
export const MAX_TOTAL_SIZE = 200 * 1024 * 1024;

/** Accepted MIME types for react-dropzone `accept` prop */
export const ACCEPTED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/heic": [".heic"],
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/webm": [".webm"],
};

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  encryptedKey: string; // base64 sealed box
  s3Key: string;
  nonce: string; // base64
  status: "encrypting" | "uploading" | "done" | "error";
  progress: number; // 0-100
  thumbnailUrl?: string; // for image preview via createObjectURL on original file
}

const EPHEMERAL_KEY_STORAGE = "legalconnect_ephemeral_keypair";

async function getOrCreateEphemeralKeypair(): Promise<{
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}> {
  await sodium.ready;

  const stored = sessionStorage.getItem(EPHEMERAL_KEY_STORAGE);
  if (stored) {
    const parsed = JSON.parse(stored);
    return {
      publicKey: sodium.from_base64(
        parsed.publicKey,
        sodium.base64_variants.ORIGINAL,
      ),
      privateKey: sodium.from_base64(
        parsed.privateKey,
        sodium.base64_variants.ORIGINAL,
      ),
    };
  }

  const kp = sodium.crypto_box_keypair();
  sessionStorage.setItem(
    EPHEMERAL_KEY_STORAGE,
    JSON.stringify({
      publicKey: sodium.to_base64(
        kp.publicKey,
        sodium.base64_variants.ORIGINAL,
      ),
      privateKey: sodium.to_base64(
        kp.privateKey,
        sodium.base64_variants.ORIGINAL,
      ),
    }),
  );

  return { publicKey: kp.publicKey, privateKey: kp.privateKey };
}

function isImageFile(type: string): boolean {
  return type.startsWith("image/") && type !== "image/heic";
}

export function useFileEncryption() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const encryptAndUpload = useCallback(async (file: File) => {
    const fileId = crypto.randomUUID();

    // Create thumbnail URL for non-HEIC images
    const thumbnailUrl = isImageFile(file.type)
      ? URL.createObjectURL(file)
      : undefined;

    // Add file to state with encrypting status
    const newFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      encryptedKey: "",
      s3Key: "",
      nonce: "",
      status: "encrypting",
      progress: 0,
      thumbnailUrl,
    };
    setFiles((prev) => [...prev, newFile]);

    try {
      await sodium.ready;

      // Read file as Uint8Array
      const fileBuffer = new Uint8Array(await file.arrayBuffer());

      // Generate random per-file symmetric key (32 bytes)
      const fileKey = sodium.randombytes_buf(
        sodium.crypto_secretbox_KEYBYTES,
      );

      // Encrypt file content with XChaCha20-Poly1305
      const { ciphertext, nonce } = await encrypt(fileBuffer, fileKey);

      // For anonymous users: use ephemeral keypair
      const ephemeralKp = await getOrCreateEphemeralKeypair();

      // Seal the file key with ephemeral public key (crypto_box_seal)
      const sealedKey = sodium.crypto_box_seal(
        fileKey,
        ephemeralKp.publicKey,
      );
      const encryptedKeyB64 = sodium.to_base64(
        sealedKey,
        sodium.base64_variants.ORIGINAL,
      );
      const nonceB64 = sodium.to_base64(
        nonce,
        sodium.base64_variants.ORIGINAL,
      );

      // Derive SSE-C key deterministically from file key (Pitfall 3 recommendation)
      const ssecKey = sodium.crypto_generichash(32, fileKey);
      const ssecKeyB64 = sodium.to_base64(
        ssecKey,
        sodium.base64_variants.ORIGINAL,
      );

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "uploading" as const, progress: 50 } : f,
        ),
      );

      // Create FormData with encrypted blob
      const formData = new FormData();
      formData.set("file", new Blob([ciphertext]));
      formData.set("fileName", file.name);
      formData.set("ssecKey", ssecKeyB64);

      // Upload via server action
      const result = await uploadEncryptedFile(formData);

      if ("error" in result) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: "error" as const, progress: 0 } : f,
          ),
        );
        return;
      }

      // Success: update file with final data
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "done" as const,
                progress: 100,
                encryptedKey: encryptedKeyB64,
                s3Key: result.s3Key,
                nonce: nonceB64,
              }
            : f,
        ),
      );
    } catch (error) {
      console.error("Encryption/upload failed:", error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "error" as const, progress: 0 } : f,
        ),
      );
    }
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.thumbnailUrl) {
        URL.revokeObjectURL(file.thumbnailUrl);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  return { files, encryptAndUpload, removeFile };
}
