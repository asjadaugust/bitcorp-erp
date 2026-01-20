// Updated to match new JWT structure from backend (Phase 23)
// Backend JWT payload includes: id_usuario, id_empresa, codigo_empresa, rol (single string)
export interface User {
  id: string | number; // User ID (for backward compatibility)
  id_usuario?: number; // NEW: User ID from JWT (id_usuario)
  id_empresa?: number; // NEW: Tenant ID from JWT
  codigo_empresa?: string; // NEW: Tenant code from JWT (e.g., "UO-001")
  username: string;
  email: string;
  full_name: string;
  nombres?: string; // NEW: First name(s)
  apellidos?: string; // NEW: Last name(s)
  nombre_completo?: string; // NEW: Full name from JWT
  first_name?: string; // DEPRECATED: Use nombres
  last_name?: string; // DEPRECATED: Use apellidos
  roles: string[]; // DEPRECATED: Backend returns single 'rol'
  rol?: string; // NEW: Single role from JWT (ADMIN, DIRECTOR, etc.)
  unidad_operativa_id?: number; // NEW: Operating unit ID
  unidad_operativa_nombre?: string; // NEW: Operating unit name
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}
