export enum ChecklistType {
  PRE_OPERATION = 'pre_operation',
  POST_OPERATION = 'post_operation',
  DAILY_INSPECTION = 'daily_inspection',
  WEEKLY_INSPECTION = 'weekly_inspection',
  MONTHLY_INSPECTION = 'monthly_inspection',
}

export enum ChecklistStatus {
  PASS = 'pass',
  FAIL = 'fail',
  NEEDS_ATTENTION = 'needs_attention',
  NOT_APPLICABLE = 'not_applicable',
}

export interface ChecklistTemplateItem {
  id: string;
  item_order: number;
  item_description: string;
  category?: string;
  is_required: boolean;
  expected_value?: string;
  allow_photos: boolean;
  allow_comments: boolean;
}

export interface ChecklistTemplate {
  id: string;
  company_id?: string;
  checklist_type: ChecklistType;
  template_name: string;
  description?: string;
  equipment_category_id?: string;
  items: ChecklistTemplateItem[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  item_order: number;
  item_description: string;
  category?: string;
  status: ChecklistStatus;
  actual_value?: string;
  comments?: string;
  photos?: string[];
}

export interface EquipmentChecklist {
  id: string;
  company_id?: string;
  equipment_id: string;
  equipment_code?: string;
  equipment_description?: string;
  operator_id?: string;
  operator_name?: string;
  daily_report_id?: string;
  template_id?: string;
  template_name?: string;
  checklist_type: ChecklistType;
  checklist_date: string;
  items: ChecklistItem[];
  overall_status: ChecklistStatus;
  observations?: string;
  photos?: string[];
  signed_by?: string;
  signature_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChecklistTemplateDto {
  checklist_type: ChecklistType;
  template_name: string;
  description?: string;
  equipment_category_id?: string;
  items: Omit<ChecklistTemplateItem, 'id'>[];
  is_active?: boolean;
}

export interface CreateChecklistDto {
  equipment_id: string;
  checklist_type: ChecklistType;
  template_id?: string;
  operator_id?: string;
  daily_report_id?: string;
  items: Omit<ChecklistItem, 'id'>[];
  observations?: string;
  photos?: string[];
  signed_by?: string;
  signature_url?: string;
}

export interface ChecklistFilters {
  equipment_id?: string;
  operator_id?: string;
  daily_report_id?: string;
  checklist_type?: ChecklistType;
  overall_status?: ChecklistStatus;
  start_date?: string;
  end_date?: string;
  company_id?: string;
  page?: number;
  limit?: number;
}

export interface ChecklistSummary {
  total_checklists: number;
  status_breakdown: {
    pass: number;
    fail: number;
    needs_attention: number;
    not_applicable: number;
  };
  by_type: {
    [key in ChecklistType]?: number;
  };
  recent_failures: {
    id: string;
    equipment_code: string;
    checklist_date: string;
    failed_items: number;
  }[];
}
