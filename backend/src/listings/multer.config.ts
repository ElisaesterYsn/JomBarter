import { BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

export const MAX_IMAGE_SIZE_MB = 10;

export const listingImageStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'jombarter/listings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    resource_type: 'image' as 'image',
  }),
});

export const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'jombarter/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    resource_type: 'image' as 'image',
  }),
});

/**
 * Rejects anything that is not an allowed image MIME type.
 */
export function mediaFileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if ((ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `"${file.mimetype}" is not allowed. Accepted image formats: JPEG, PNG, WebP, GIF`,
      ),
      false,
    );
  }
}
