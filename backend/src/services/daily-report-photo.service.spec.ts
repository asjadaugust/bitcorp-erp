import { DailyReportPhotoService } from './daily-report-photo.service';
import { AppDataSource } from '../config/database.config';
import { DailyReportPhoto } from '../models/daily-report-photo.model';
import { NotFoundError } from '../errors/http.errors';
import * as uploadMiddleware from '../middleware/upload.middleware';

jest.mock('../config/database.config', () => ({
  AppDataSource: {
    isInitialized: true,
    getRepository: jest.fn(),
  },
}));

jest.mock('../middleware/upload.middleware', () => ({
  deleteFile: jest.fn(),
}));

describe('DailyReportPhotoService', () => {
  let service: DailyReportPhotoService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRepo: jest.Mocked<any>;

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

    service = new DailyReportPhotoService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPhotosByReportId', () => {
    it('returns photos for the given report and tenant', async () => {
      const photos: Partial<DailyReportPhoto>[] = [
        { id: 1, parteDiarioId: 10, filename: 'photo-1.jpg', tenantId: 1, orden: 0 },
        { id: 2, parteDiarioId: 10, filename: 'photo-2.jpg', tenantId: 1, orden: 1 },
      ];
      mockRepo.find.mockResolvedValue(photos);

      const result = await service.getPhotosByReportId(1, 10);

      expect(result).toHaveLength(2);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { parteDiarioId: 10, tenantId: 1 },
        order: { orden: 'ASC', createdAt: 'ASC' },
      });
    });

    it('returns empty array when no photos exist', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.getPhotosByReportId(1, 99);

      expect(result).toEqual([]);
    });
  });

  describe('uploadPhotos', () => {
    it('creates DailyReportPhoto records with correct tenant_id', async () => {
      mockRepo.count.mockResolvedValue(0);
      mockRepo.create.mockImplementation((data) => ({ id: 100, ...data }));
      mockRepo.save.mockImplementation((entity) => Promise.resolve({ ...entity, id: 100 }));

      const files = [
        {
          filename: 'photo-12345.jpg',
          originalname: 'my-photo.jpg',
          mimetype: 'image/jpeg',
          size: 102400,
        },
      ] as Express.Multer.File[];

      const result = await service.uploadPhotos(1, 10, files);

      expect(result).toHaveLength(1);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parteDiarioId: 10,
          filename: 'photo-12345.jpg',
          originalName: 'my-photo.jpg',
          mimeType: 'image/jpeg',
          size: 102400,
          orden: 0,
          tenantId: 1,
        })
      );
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('sets correct orden when photos already exist', async () => {
      mockRepo.count.mockResolvedValue(3); // 3 existing photos
      mockRepo.create.mockImplementation((data) => ({ id: 101, ...data }));
      mockRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const files = [
        { filename: 'photo-a.jpg', originalname: 'a.jpg', mimetype: 'image/jpeg', size: 5000 },
        { filename: 'photo-b.jpg', originalname: 'b.jpg', mimetype: 'image/jpeg', size: 6000 },
      ] as Express.Multer.File[];

      await service.uploadPhotos(1, 10, files);

      expect(mockRepo.create).toHaveBeenCalledTimes(2);
      expect(mockRepo.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ orden: 3 }));
      expect(mockRepo.create).toHaveBeenNthCalledWith(2, expect.objectContaining({ orden: 4 }));
    });
  });

  describe('deletePhoto', () => {
    it('removes record and file from disk', async () => {
      const photo: Partial<DailyReportPhoto> = {
        id: 5,
        parteDiarioId: 10,
        filename: 'photo-99.jpg',
        tenantId: 1,
      };
      mockRepo.findOne.mockResolvedValue(photo);
      mockRepo.remove.mockResolvedValue(undefined);

      await service.deletePhoto(1, 10, 5);

      expect(mockRepo.remove).toHaveBeenCalledWith(photo);
      expect(uploadMiddleware.deleteFile).toHaveBeenCalledWith(
        expect.stringContaining('photo-99.jpg')
      );
    });

    it('throws NotFoundError for non-existent photo', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.deletePhoto(1, 10, 999)).rejects.toThrow(NotFoundError);
    });

    it('enforces tenant isolation — rejects if tenantId does not match', async () => {
      mockRepo.findOne.mockResolvedValue(null); // no match for wrong tenant

      await expect(service.deletePhoto(2, 10, 5)).rejects.toThrow(NotFoundError);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 5, parteDiarioId: 10, tenantId: 2 },
      });
    });
  });
});
