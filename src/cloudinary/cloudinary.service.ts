import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const toStream = require('buffer-to-stream');

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      // Extract filename without extension from original file
      const originalName = file.originalname;
      const fileNameWithoutExt =
        originalName.substring(0, originalName.lastIndexOf('.')) ||
        originalName;

      const uploadOptions: any = {
        folder: folder || 'uploads', // Default folder if not specified
        public_id: fileNameWithoutExt, // Use original filename
        use_filename: true,
        unique_filename: false, // Don't add random suffix
      };

      const upload = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) return reject(error);
          if (!result) {
            return reject(new Error('Upload failed: no result returned'));
          }
          resolve(result);
        },
      );

      toStream(file.buffer).pipe(upload);
    });
  }
}
