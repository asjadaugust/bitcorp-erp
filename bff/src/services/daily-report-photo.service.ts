import { AppDataSource } from '../config/database.config';
import { DailyReportPhoto } from '../models/daily-report-photo.model';
import { NotFoundError } from '../errors/http.errors';
import { deleteFile } from '../middleware/upload.middleware';
import Logger from '../utils/logger';
import * as path from 'path';

export class DailyReportPhotoService {
  private getRepository() {
    return AppDataSource.getRepository(DailyReportPhoto);
  }

  async getPhotosByReportId(tenantId: number, reportId: number): Promise<DailyReportPhoto[]> {
    const repo = this.getRepository();
    return repo.find({
      where: { parteDiarioId: reportId, tenantId },
      order: { orden: 'ASC', createdAt: 'ASC' },
    });
  }

  async uploadPhotos(
    tenantId: number,
    reportId: number,
    files: Express.Multer.File[]
  ): Promise<DailyReportPhoto[]> {
    const repo = this.getRepository();

    // Get current max orden for this report
    const existing = await repo.count({ where: { parteDiarioId: reportId, tenantId } });

    const photos: DailyReportPhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const photo = repo.create({
        parteDiarioId: reportId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        orden: existing + i,
        tenantId,
      });
      const saved = await repo.save(photo);
      photos.push(saved);
    }

    Logger.info('Photos uploaded for daily report', {
      tenantId,
      reportId,
      count: photos.length,
      context: 'DailyReportPhotoService.uploadPhotos',
    });

    return photos;
  }

  async deletePhoto(tenantId: number, reportId: number, photoId: number): Promise<void> {
    const repo = this.getRepository();

    const photo = await repo.findOne({
      where: { id: photoId, parteDiarioId: reportId, tenantId },
    });

    if (!photo) {
      throw new NotFoundError('Foto de parte diario', String(photoId));
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '../../uploads/daily-reports', photo.filename);
    deleteFile(filePath);

    // Delete DB record
    await repo.remove(photo);

    Logger.info('Photo deleted from daily report', {
      tenantId,
      reportId,
      photoId,
      filename: photo.filename,
      context: 'DailyReportPhotoService.deletePhoto',
    });
  }
}
