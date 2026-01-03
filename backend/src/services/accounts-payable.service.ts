import { AccountsPayable, AccountsPayableStatus } from '../models/accounts-payable.model';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';

export class AccountsPayableService {
  async create(data: Partial<AccountsPayable>): Promise<AccountsPayable> {
    const newAccountPayable = AccountsPayableRepository.create(data);
    return await AccountsPayableRepository.save(newAccountPayable);
  }

  async findAll(): Promise<AccountsPayable[]> {
    return await AccountsPayableRepository.find({
      relations: ['provider'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<AccountsPayable | null> {
    return await AccountsPayableRepository.findOne({
      where: { id },
      relations: ['provider'],
    });
  }

  async update(id: number, data: Partial<AccountsPayable>): Promise<AccountsPayable | null> {
    const accountPayable = await this.findOne(id);
    if (!accountPayable) return null;

    AccountsPayableRepository.merge(accountPayable, data);
    return await AccountsPayableRepository.save(accountPayable);
  }

  async delete(id: number): Promise<boolean> {
    const result = await AccountsPayableRepository.delete(id);
    return result.affected !== 0;
  }

  async findPending(): Promise<AccountsPayable[]> {
    return await AccountsPayableRepository.findPending();
  }

  async updateStatus(id: number, status: AccountsPayableStatus): Promise<AccountsPayable | null> {
    return await this.update(id, { status });
  }
}
