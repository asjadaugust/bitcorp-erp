export interface DailyReport {
  id?: number;
  equipmentId: number;
  operatorId: number;
  projectId: number;
  reportDate: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  hourmeterStart?: number;
  hourmeterEnd?: number;
  hourmeterDiff?: number;
  odometerStart?: number;
  odometerEnd?: number;
  odometerDiff?: number;
  fuelConsumed?: number;
  fuelType?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  workDescription?: string;
  observations?: string;
  photoUrls?: string[];
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: number;
  approvedAt?: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyReportFormData {
  equipmentId: number;
  operatorId: number;
  projectId: number;
  reportDate: string;
  startTime: string;
  endTime: string;
  hourmeterStart?: number;
  hourmeterEnd?: number;
  odometerStart?: number;
  odometerEnd?: number;
  fuelConsumed?: number;
  fuelType?: string;
  workDescription?: string;
  observations?: string;
  photos?: File[];
}
