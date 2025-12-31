export interface MaintenanceSchedule {
  id: number;
  equipmentId: number;
  maintenanceType: string; // 'preventive' | 'corrective' | 'predictive'
  intervalType: string; // 'hours' | 'days' | 'weeks' | 'months'
  intervalValue: number;
  lastCompletedDate?: Date;
  lastCompletedHours?: number;
  nextDueDate?: Date;
  nextDueHours?: number;
  status: string; // 'active' | 'paused' | 'completed' | 'cancelled'
  description?: string;
  notes?: string;
  autoGenerateTasks: boolean;
  createdBy?: number;
  projectId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  equipment?: any; // Reference to Equipment if needed
}

export interface ScheduledTask {
  id: number;
  scheduleId?: number;
  equipmentId: number;
  operatorId?: number;
  taskType: string; // 'maintenance' | 'assignment' | 'inspection'
  title: string;
  description?: string;
  scheduledDate: Date;
  scheduledTime?: string;
  durationMinutes: number;
  priority: string; // 'low' | 'medium' | 'high' | 'urgent'
  status: string; // 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'
  completionDate?: Date;
  completionNotes?: string;
  maintenanceRecordId?: number;
  createdBy?: number;
  assignedBy?: number;
  projectId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  equipment?: any;
  operator?: any;
  schedule?: MaintenanceSchedule;
}

export interface Timesheet {
  id: number;
  timesheetCode: string;
  operatorId: number;
  projectId?: string;
  periodStart: Date;
  periodEnd: Date;
  totalHours: number;
  totalDays: number;
  regularHours?: number;
  overtimeHours?: number;
  status: string; // 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'
  generatedFromReports: boolean;
  notes?: string;
  submittedAt?: Date;
  submittedBy?: number;
  approvedAt?: Date;
  approvedBy?: number;
  rejectedAt?: Date;
  rejectedBy?: number;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
  operator?: any;
  project?: any;
  details?: TimesheetDetail[];
}

export interface TimesheetDetail {
  id: number;
  timesheetId: number;
  dailyReportId?: number;
  workDate: Date;
  hoursWorked: number;
  equipmentId?: number;
  description?: string;
  createdAt?: Date;
  equipment?: any;
}

export interface GenerateTimesheetDto {
  operatorId: number;
  projectId?: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
}
