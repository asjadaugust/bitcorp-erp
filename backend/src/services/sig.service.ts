import { AppDataSource } from '../config/database.config';
import { SigDocument } from '../models/sig-document.model';

export class SigService {
  private sigRepository = AppDataSource.getRepository(SigDocument);

  async getAllDocuments() {
    return this.sigRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async createDocument(data: Partial<SigDocument>) {
    const document = this.sigRepository.create(data);
    return this.sigRepository.save(document);
  }

  async getDocumentById(id: string) {
    return this.sigRepository.findOneBy({ id });
  }
}
