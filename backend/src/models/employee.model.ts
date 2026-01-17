/**
 * Employee DTO (Data Transfer Object)
 *
 * This interface provides English field names for the API layer,
 * mapping to the Spanish database fields in rrhh.trabajador table.
 *
 * The actual database entity is Trabajador (trabajador.model.ts).
 * This Employee interface is used for API responses and requests
 * to provide a cleaner, English-based interface.
 */
export interface Employee {
  id: number;
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate?: Date;
  address?: string;
  phone?: string;
  email?: string;
  hireDate?: Date;
  position?: string;
  department?: string;
  contractType?: string;
  terminationDate?: Date;
  driverLicense?: string;
  operatingUnitId?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  fullName?: string;
}
