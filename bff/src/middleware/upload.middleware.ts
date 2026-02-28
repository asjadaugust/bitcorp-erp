import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../../uploads');
const dailyReportsDir = path.join(uploadsDir, 'daily-reports');
const equipmentDir = path.join(uploadsDir, 'equipment');
const operatorDir = path.join(uploadsDir, 'operators');
const providerDir = path.join(uploadsDir, 'providers');
const contractsDir = path.join(uploadsDir, 'contracts');

[uploadsDir, dailyReportsDir, equipmentDir, operatorDir, contractsDir, providerDir].forEach(
  (dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
);

// ... (existing storage configs)

// Storage configuration for provider documents
const providerDocumentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, providerDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `provider-doc-${uniqueSuffix}${ext}`);
  },
});

import { Request } from 'express';

// Filter for documents
const documentFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'image/jpeg',
    'image/png',
    'image/jpg',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no soportado. Permite PDF, Word, Excel e imágenes.'));
  }
};

export const uploadProviderDocument = multer({
  storage: providerDocumentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}).single('file');

// Storage configuration for daily report photos
const dailyReportPhotoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, dailyReportsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `photo-${uniqueSuffix}${ext}`);
  },
});

// Filter for image files only
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes'));
  }
};

export const uploadDailyReportPhotos = multer({
  storage: dailyReportPhotoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file (already compressed by frontend)
  },
}).array('photos', 5);

// Helper to delete file
export const deleteFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Helper to get file URL
export const getFileUrl = (filename: string, category: string): string => {
  return `/uploads/${category}/${filename}`;
};
