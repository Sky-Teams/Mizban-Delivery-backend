import multer from 'multer';
import { fileFilter, IMAGE_MAX_SIZE, storage } from '#shared/utils/fileUpload.helper.js';
// export this middleware and then use it in needed routes
export const uploadFile = multer({
  storage,
  limits: { fileSize: IMAGE_MAX_SIZE * 1024 * 1024 }, // Max size of the image
  fileFilter,
});

export default uploadFile;
