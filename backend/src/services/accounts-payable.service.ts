import { AccountsPayableStatus } from '../models/accounts-payable.model';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';
import {
  toAccountsPayableDto,
  fromAccountsPayableDto,
  AccountsPayableDto,
} from '../types/dto/accounts-payable.dto';

// DTOs for create/update operations
// Support both English camelCase (from frontend) and Spanish snake_case (from API)
export interface CreateAccountsPayableDto {
  // Frontend sends camelCase field names
  providerId?: number; // proveedor_id
  documentNumber?: string; // numero_factura
  issueDate?: string; // fecha_emision
  dueDate?: string; // fecha_vencimiento
  amount?: number; // monto_total
  amountPaid?: number; // monto_pagado
  currency?: string; // moneda
  status?: AccountsPayableStatus; // estado
  description?: string; // observaciones

  // Also support Spanish snake_case
  proveedor_id?: number;
  numero_factura?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  monto_total?: number;
  monto_pagado?: number;
  moneda?: string;
  estado?: AccountsPayableStatus;
  observaciones?: string;
}

export interface UpdateAccountsPayableDto extends Partial<CreateAccountsPayableDto> {}

export class AccountsPayableService {
  async create(data: CreateAccountsPayableDto): Promise<AccountsPayableDto> {
    // Map frontend camelCase and Spanish snake_case to DTO format
    const accountsPayableData: Partial<AccountsPayableDto> = {
      proveedor_id: data.proveedor_id || data.providerId,
      numero_factura: data.numero_factura || data.documentNumber,
      fecha_emision: data.fecha_emision || data.issueDate,
      fecha_vencimiento: data.fecha_vencimiento || data.dueDate,
      monto_total: data.monto_total || data.amount,
      monto_pagado: data.monto_pagado || data.amountPaid || 0,
      moneda: data.moneda || data.currency || 'PEN',
      estado: data.estado || data.status || AccountsPayableStatus.PENDING,
      observaciones: data.observaciones || data.description || null,
    };

    const entity = AccountsPayableRepository.create(fromAccountsPayableDto(accountsPayableData));
    const saved = await AccountsPayableRepository.save(entity);

    // Reload with relations
    const reloaded = await AccountsPayableRepository.findOne({
      where: { id: saved.id },
      relations: ['provider'],
    });

    return toAccountsPayableDto(reloaded!);
  }

  async findAll(): Promise<AccountsPayableDto[]> {
    const accounts = await AccountsPayableRepository.find({
      relations: ['provider'],
      order: { created_at: 'DESC' },
    });
    return accounts.map((a) => toAccountsPayableDto(a));
  }

  async findOne(id: number): Promise<AccountsPayableDto | null> {
    const account = await AccountsPayableRepository.findOne({
      where: { id },
      relations: ['provider'],
    });

    if (!account) return null;
    return toAccountsPayableDto(account);
  }

  async update(id: number, data: UpdateAccountsPayableDto): Promise<AccountsPayableDto | null> {
    const accountPayable = await AccountsPayableRepository.findOne({
      where: { id },
      relations: ['provider'],
    });

    if (!accountPayable) return null;

    // Map frontend camelCase and Spanish snake_case to DTO format
    const updateData: Partial<AccountsPayableDto> = {};

    if (data.proveedor_id !== undefined || data.providerId !== undefined)
      updateData.proveedor_id = data.proveedor_id || data.providerId;
    if (data.numero_factura !== undefined || data.documentNumber !== undefined)
      updateData.numero_factura = data.numero_factura || data.documentNumber;
    if (data.fecha_emision !== undefined || data.issueDate !== undefined)
      updateData.fecha_emision = data.fecha_emision || data.issueDate;
    if (data.fecha_vencimiento !== undefined || data.dueDate !== undefined)
      updateData.fecha_vencimiento = data.fecha_vencimiento || data.dueDate;
    if (data.monto_total !== undefined || data.amount !== undefined)
      updateData.monto_total = data.monto_total || data.amount;
    if (data.monto_pagado !== undefined || data.amountPaid !== undefined)
      updateData.monto_pagado = data.monto_pagado || data.amountPaid;
    if (data.moneda !== undefined || data.currency !== undefined)
      updateData.moneda = data.moneda || data.currency;
    if (data.estado !== undefined || data.status !== undefined)
      updateData.estado = data.estado || data.status;
    if (data.observaciones !== undefined || data.description !== undefined)
      updateData.observaciones = data.observaciones || data.description;

    // Merge changes
    const entityChanges = fromAccountsPayableDto(updateData);
    AccountsPayableRepository.merge(accountPayable, entityChanges);

    const saved = await AccountsPayableRepository.save(accountPayable);
    return toAccountsPayableDto(saved);
  }

  async delete(id: number): Promise<boolean> {
    const result = await AccountsPayableRepository.delete(id);
    return result.affected !== 0;
  }

  async findPending(): Promise<AccountsPayableDto[]> {
    const accounts = await AccountsPayableRepository.findPending();
    return accounts.map((a) => toAccountsPayableDto(a));
  }

  async updateStatus(
    id: number,
    status: AccountsPayableStatus
  ): Promise<AccountsPayableDto | null> {
    return await this.update(id, { estado: status });
  }
}
