import path from 'path';
import fs from 'fs';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { AppError } from '#shared/errors/error.js';
import multer from 'multer';

export const IMAGE_MAX_SIZE = process.env.IMAGE_MAX_SIZE || 2;

const DESTINATION = 'src/uploads/documents';

// if '/uploads/documents' doesn't exist, first it will create it.
const uploadDir = path.join(process.cwd(), DESTINATION);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Define the storage path and create new name for image
export const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${DESTINATION}/`);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${req.user._id}-${Date.now()}`;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// originalname -> profile.png
// extname -> .png
// mimetype -> type of file (image/jpg)

// validate allowed image types
export const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLocaleLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) cb(null, true);
  else
    cb(
      new AppError(
        'Only these types of images are allowed (jpeg, jpg, png, webp)',
        400,
        ERROR_CODES.INVALID_IMAGE_TYPE
      )
    );
};
