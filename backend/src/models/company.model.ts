export interface Company {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: {
    timezone?: string;
    currency?: string;
    language?: string;
    dateFormat?: string;
  };
  subscription?: {
    plan: 'trial' | 'basic' | 'professional' | 'enterprise';
    startDate: Date;
    endDate?: Date;
    maxProjects: number;
    maxUsers: number;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  billingInfo?: {
    taxId?: string;
    billingEmail?: string;
    paymentMethod?: string;
  };
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface CreateCompanyDto {
  name: string;
  subdomain: string;
  settings?: Company['settings'];
  subscription?: Company['subscription'];
  contactInfo?: Company['contactInfo'];
  billingInfo?: Company['billingInfo'];
}

export interface UpdateCompanyDto extends Partial<CreateCompanyDto> {
  status?: Company['status'];
}
