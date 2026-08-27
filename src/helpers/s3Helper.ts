import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import config from '../config';
import { logger } from '../shared/logger';

const isAwsConfigured =
  !!config.aws.access_key_id &&
  !!config.aws.secret_access_key &&
  !!config.aws.s3_bucket_name;

// S3 Client Configuration
const s3Client = isAwsConfigured
  ? new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.access_key_id as string,
        secretAccessKey: config.aws.secret_access_key as string,
      },
    })
  : null;

// Client hasn't provided AWS credentials yet — save to local disk (served via
// express.static("uploads")) so uploads still work for testing. Once real
// AWS_* env vars are set, isAwsConfigured flips true and this stops being used.
const saveLocally = (file: Express.Multer.File, folder: string): string => {
  const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
  const dir = path.join(process.cwd(), 'uploads', folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), file.buffer);

  logger.info(`[DEV UPLOAD] AWS not configured, saved locally: ${folder}/${fileName}`);
  return `${config.backend_url}/${folder}/${fileName}`;
};

// Upload file to S3
export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<string> => {
  if (!s3Client) {
    return saveLocally(file, folder);
  }

  const fileName = `${folder}/${Date.now()}-${file.originalname.replace(
    /\s+/g,
    '-'
  )}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: config.aws.s3_bucket_name as string,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Make file publicly accessible
    },
  });

  await upload.done();

  // Return the S3 URL
  return `https://${config.aws.s3_bucket_name}.s3.${config.aws.region}.amazonaws.com/${fileName}`;
};

// Upload multiple files to S3
export const uploadMultipleToS3 = async (
  files: Express.Multer.File[],
  folder: string = 'uploads'
): Promise<string[]> => {
  const uploadPromises = files.map((file) => uploadToS3(file, folder));
  return await Promise.all(uploadPromises);
};

export const s3Helper = {
  uploadToS3,
  uploadMultipleToS3,
};
