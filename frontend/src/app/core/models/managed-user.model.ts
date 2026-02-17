export interface ManagedUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  dni?: string;
  phone?: string;
  rol_id?: number;
  unidad_operativa_id?: number;
  rol: { id: number; code: string; name: string } | null;
  unidad_operativa: { id: number; nombre: string } | null;
  is_active: boolean;
  last_login?: string | Date;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  first_name?: string;
  last_name?: string;
  dni?: string;
  phone?: string;
  rol_id: number;
  unidad_operativa_id?: number;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  dni?: string;
  phone?: string;
  rol_id?: number;
  unidad_operativa_id?: number;
  is_active?: boolean;
}

export interface RoleOption {
  id: number;
  code: string;
  name: string;
}
