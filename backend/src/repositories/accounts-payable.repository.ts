import { AppDataSource } from '../config/database.config';
import { AccountsPayable } from '../models/accounts-payable.model';

export const AccountsPayableRepository = AppDataSource.getRepository(AccountsPayable).extend({
  async findByProvider(tenantId: number, providerId: number): Promise<AccountsPayable[]> {
    return this.find({
      where: { provider_id: providerId, tenantId },
      relations: ['provider', 'project', 'cost_center'],
      order: { issue_date: 'DESC' },
    });
  },

  async findPending(tenantId: number): Promise<AccountsPayable[]> {
    return this.createQueryBuilder('ap')
      .leftJoinAndSelect('ap.provider', 'provider')
      .where('ap.tenantId = :tenantId', { tenantId })
      .andWhere("ap.status = 'PENDIENTE'")
      .orderBy('ap.dueDate', 'ASC')
      .getMany();
  },

  async findByProject(tenantId: number, projectId: string): Promise<AccountsPayable[]> {
    return this.find({
      where: { project_id: projectId, tenantId },
      relations: ['provider', 'project', 'cost_center'],
      order: { issue_date: 'DESC' },
    });
  },
});
