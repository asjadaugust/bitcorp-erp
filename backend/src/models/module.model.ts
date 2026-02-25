import { BaseModel } from './base.model';

export interface Module extends BaseModel {
  codigo: string;
  nombreEs: string;
  nombreEn?: string;
  descripcion?: string;
  icono?: string;
  ruta?: string;
  nivel: number;
  orden: number;
  parentId?: string;
  isActive: boolean;
}

export interface UserModulePermission {
  id: string;
  userId: string;
  moduleId: string;
  puedeVer: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeAprobar: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModulePage {
  id: string;
  moduleId: string;
  codigo: string;
  nombreEs: string;
  nombreEn?: string;
  descripcion?: string;
  ruta?: string;
  orden: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleWithPermissions extends Module {
  permissions: {
    puedeVer: boolean;
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
    puedeAprobar: boolean;
  };
  pages?: ModulePage[];
}
