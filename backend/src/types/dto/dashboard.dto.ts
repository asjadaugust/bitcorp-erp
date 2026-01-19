/**
 * Dashboard DTOs
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching API contract
 * - Validation with class-validator for input DTOs
 */

import { IsNotEmpty, IsNumber } from 'class-validator';

/**
 * DTO for switching active project (Input)
 */
export class SwitchProjectDto {
  @IsNotEmpty({ message: 'El ID del proyecto es requerido' })
  @IsNumber({}, { message: 'El ID del proyecto debe ser numérico' })
  project_id!: number;
}

/**
 * User information in dashboard context (Response)
 */
export interface UserDto {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  roles: string[];
}

/**
 * Project summary for dashboard (Response)
 */
export interface ProjectSummaryDto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado: string;
  assigned_date?: Date;
}

/**
 * Complete user info with projects (Response)
 */
export interface UserInfoDto {
  user: UserDto;
  active_project: ProjectSummaryDto | null;
  assigned_projects: ProjectSummaryDto[];
}

/**
 * Dashboard statistics (Response)
 */
export interface DashboardStatsDto {
  total_equipment: number;
  active_equipment: number;
  total_operators: number;
  pending_reports: number;
}

/**
 * Project switch response (Response)
 */
export interface ProjectSwitchResponseDto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado: string;
  message?: string;
}
