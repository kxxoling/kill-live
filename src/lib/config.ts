export function isS3Configured(): boolean {
  return !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_REGION &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET
  );
}

export const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT;
