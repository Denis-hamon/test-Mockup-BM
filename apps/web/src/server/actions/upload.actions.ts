"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import crypto from "node:crypto";

export async function uploadEncryptedFile(
  formData: FormData,
): Promise<{ s3Key: string } | { error: string }> {
  try {
    const encryptedBlob = formData.get("file") as Blob;
    const fileName = formData.get("fileName") as string;
    const ssecKeyBase64 = formData.get("ssecKey") as string;

    if (!encryptedBlob || !fileName || !ssecKeyBase64) {
      return { error: "missing_fields" };
    }

    const s3Key = `intake/${crypto.randomUUID()}/${fileName}`;
    const ssecKey = Buffer.from(ssecKeyBase64, "base64");
    const ssecKeyMd5 = crypto
      .createHash("md5")
      .update(ssecKey)
      .digest("base64");

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.OVH_S3_BUCKET!,
        Key: s3Key,
        Body: Buffer.from(await encryptedBlob.arrayBuffer()),
        SSECustomerAlgorithm: "AES256",
        SSECustomerKey: ssecKeyBase64,
        SSECustomerKeyMD5: ssecKeyMd5,
      }),
    );

    return { s3Key };
  } catch (error) {
    console.error("Upload failed:", error);
    return { error: "upload_failed" };
  }
}
