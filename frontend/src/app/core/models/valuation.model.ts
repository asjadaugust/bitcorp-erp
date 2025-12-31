export interface Valuation {
  id: number;
  contract_id: number;
  period_start: string;
  period_end: string;
  amount: number;
  base_amount?: number;
  overtime_amount?: number;
  fuel_amount?: number;
  status: 'draft' | 'submitted' | 'approved' | 'paid' | 'rejected' | 'pending' | 'under_review';
  invoice_number?: string;
  issue_date?: string;
  payment_date?: string;
  created_at?: string;
  updated_at?: string;

  // Relations
  contract?: {
    id: number;
    code: string;
    project_name: string;
    client_name: string;
  };
}
