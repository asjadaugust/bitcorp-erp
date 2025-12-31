export interface Project {
  id: string;
  codigo_proyecto: string;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  estado: 'active' | 'completed' | 'on-hold' | 'cancelled';
  presupuesto_total?: number;
  cliente?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
