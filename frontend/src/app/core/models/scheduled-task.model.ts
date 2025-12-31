export interface ScheduledTask {
  id: number;
  equipment_id: number;
  equipment?: any;
  equipment_code?: string; // Denormalized for display
  operator_id?: number;
  operator?: any;
  operator_name?: string; // Denormalized for display
  schedule_id?: number;
  schedule?: any;
  task_type: string;
  title?: string; // Task title
  description: string;
  scheduled_date?: string; // Deprecated, use start_date
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  recurrence?: string;
  estimated_duration?: number; // in hours
  duration_minutes?: number; // Duration in minutes for display
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  completion_date?: string;
  completion_notes?: string;
  maintenance_record_id?: number;
  created_by?: number;
  assigned_by?: number;
  created_at?: string;
  updated_at?: string;
}
