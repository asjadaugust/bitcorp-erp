import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../../uploads');
const dailyReportsDir = path.join(uploadsDir, 'daily-reports');
const equipmentDir = path.join(uploadsDir, 'equipment');
const operatorDir = path.join(uploadsDir, 'operators');
const contractsDir = path.join(uploadsDir, 'contracts');

[uploadsDir, dailyReportsDir, equipmentDir, operatorDir, contractsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for daily report photos
const dailyReportStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, dailyReportsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `report-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for equipment photos
const equipmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, equipmentDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `equipment-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for operator photos
const operatorStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, operatorDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `operator-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for contract documents
const contractStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, contractsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `contract-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const imageFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// File filter for documents
const documentFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /pdf|doc|docx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    cb(null, true);
  } else {
    cb(new Error('Only document files are allowed (pdf, doc, docx, xls, xlsx)'));
  }
};

// Upload middleware configurations
export const uploadDailyReportPhotos = multer({
  storage: dailyReportStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Maximum 10 files per upload
  }
}).array('photos', 10);

export const uploadEquipmentPhoto = multer({
  storage: equipmentStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('photo');

export const uploadOperatorPhoto = multer({
  storage: operatorStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
}).single('photo');

export const uploadContractDocument = multer({
  storage: contractStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('document');

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
