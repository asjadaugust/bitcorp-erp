// equipment?: any; // Equipment model
// project?: any; // Project model
export interface MaintenanceSchedule {
  id: number;
  equipmentId: number;
  equipment?: {
    id: number;
    code: string;
    name: string;
    brand: string;
    model: string;
  };
  projectId?: number;
  project?: {
    id: number;
    name: string;
  };
  maintenanceType: string; // preventive, corrective, etc.
  description: string;
  notes?: string;
  intervalType: 'hours' | 'days' | 'weeks' | 'months' | 'date';
  intervalValue: number;
  lastCompletedDate?: string;
  lastCompletedHours?: number;
  nextDueDate?: string;
  nextDueHours?: number;
  status: 'active' | 'inactive' | 'completed';
  autoGenerateTasks?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
}
