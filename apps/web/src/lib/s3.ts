import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.OVH_S3_REGION!,
  endpoint: process.env.OVH_S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.OVH_S3_ACCESS_KEY!,
    secretAccessKey: process.env.OVH_S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for OVHcloud S3
});
