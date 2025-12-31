import { BaseModel } from './base.model';

export interface Module extends BaseModel {
  codigo: string;
  nombre_es: string;
  nombre_en?: string;
  descripcion?: string;
  icono?: string;
  ruta?: string;
  nivel: number;
  orden: number;
  parent_id?: string;
  is_active: boolean;
}

export interface UserModulePermission {
  id: string;
  user_id: string;
  module_id: string;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
  puede_aprobar: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ModulePage {
  id: string;
  module_id: string;
  codigo: string;
  nombre_es: string;
  nombre_en?: string;
  descripcion?: string;
  ruta?: string;
  orden: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ModuleWithPermissions extends Module {
  permissions: {
    puede_ver: boolean;
    puede_crear: boolean;
    puede_editar: boolean;
    puede_eliminar: boolean;
    puede_aprobar: boolean;
  };
  pages?: ModulePage[];
}
