/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/daily-reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG images are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5, // Max 5 files
  },
});

export class PhotoController {
  static async uploadPhotos(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const photoUrls = files.map((file) => ({
        url: `/uploads/daily-reports/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
      }));

      res.json({
        success: true,
        message: `${files.length} photo(s) uploaded successfully`,
        data: photoUrls,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deletePhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../../../uploads/daily-reports', filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({
          success: true,
          message: 'Photo deleted successfully',
        });
      } else {
        res.status(404).json({ error: 'Photo not found' });
      }
    } catch (error) {
      next(error);
    }
  }
}
