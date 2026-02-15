export interface ScheduledTask {
  id: number;
  scheduleId?: number;
  schedule?: any;
  equipmentId: number;
  equipment?: any;
  operatorId?: number;
  operator?: any;
  taskType: string; // 'maintenance' | 'assignment' | 'inspection'
  title?: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  recurrence?: string;
  durationMinutes?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  completionDate?: string;
  completionNotes?: string;
  maintenanceRecordId?: number;
  createdBy?: number;
  assignedBy?: number;
  projectId?: number;
  project?: any;
  createdAt?: string;
  updatedAt?: string;
}
