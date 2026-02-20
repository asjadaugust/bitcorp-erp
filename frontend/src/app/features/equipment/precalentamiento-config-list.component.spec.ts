import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PrecalentamientoConfigListComponent } from './precalentamiento-config-list.component';
import { PrecalentamientoConfigService } from '../../core/services/precalentamiento-config.service';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

const mockConfigs = [
  {
    id: 1,
    tipo_equipo_id: 1,
    tipo_equipo_codigo: 'EX',
    tipo_equipo_nombre: 'Excavadora',
    categoria_prd: 'MAQUINARIA_PESADA',
    horas_precalentamiento: 0.5,
    activo: true,
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    tipo_equipo_id: 5,
    tipo_equipo_codigo: 'CV',
    tipo_equipo_nombre: 'Camión Volquete',
    categoria_prd: 'VEHICULOS_PESADOS',
    horas_precalentamiento: 0.25,
    activo: true,
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    tipo_equipo_id: 12,
    tipo_equipo_codigo: 'CA',
    tipo_equipo_nombre: 'Camioneta',
    categoria_prd: 'VEHICULOS_LIVIANOS',
    horas_precalentamiento: 0,
    activo: true,
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('PrecalentamientoConfigListComponent', () => {
  let component: PrecalentamientoConfigListComponent;
  let fixture: ComponentFixture<PrecalentamientoConfigListComponent>;
  let mockService: jasmine.SpyObj<PrecalentamientoConfigService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('PrecalentamientoConfigService', ['listar', 'actualizar']);
    mockService.listar.and.returnValue(of(mockConfigs));

    await TestBed.configureTestingModule({
      imports: [PrecalentamientoConfigListComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [{ provide: PrecalentamientoConfigService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(PrecalentamientoConfigListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Instantiation ────────────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ─── Initial Load ─────────────────────────────────────────────────────────────

  it('should load configs on init', () => {
    expect(mockService.listar).toHaveBeenCalled();
    expect(component.configs.length).toBe(3);
  });

  it('should render a row for each config', () => {
    const rows = fixture.nativeElement.querySelectorAll('[data-testid^="row-"]');
    expect(rows.length).toBe(3);
  });

  it('should display tipo codigo in each row', () => {
    const codes = fixture.nativeElement.querySelectorAll('[data-testid="tipo-codigo"]');
    expect(codes[0].textContent.trim()).toBe('EX');
    expect(codes[1].textContent.trim()).toBe('CV');
  });

  it('should display horas_precalentamiento values', () => {
    const horasEl = fixture.nativeElement.querySelector('[data-testid="horas-value-1"]');
    expect(horasEl).toBeTruthy();
    expect(horasEl.textContent).toContain('0.50');
  });

  it('should render the info banner', () => {
    const banner = fixture.nativeElement.querySelector('[data-testid="info-banner"]');
    expect(banner).toBeTruthy();
  });

  // ─── getCatLabel ──────────────────────────────────────────────────────────────

  it('should return correct label for MAQUINARIA_PESADA', () => {
    expect(component.getCatLabel('MAQUINARIA_PESADA')).toBe('Maquinaria Pesada');
  });

  it('should return correct label for VEHICULOS_PESADOS', () => {
    expect(component.getCatLabel('VEHICULOS_PESADOS')).toBe('Vehículos Pesados');
  });

  it('should return correct label for VEHICULOS_LIVIANOS', () => {
    expect(component.getCatLabel('VEHICULOS_LIVIANOS')).toBe('Vehículos Livianos');
  });

  it('should return correct label for EQUIPOS_MENORES', () => {
    expect(component.getCatLabel('EQUIPOS_MENORES')).toBe('Equipos Menores');
  });

  it('should return the raw string for an unknown category', () => {
    expect(component.getCatLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  // ─── getCatClass ──────────────────────────────────────────────────────────────

  it('should return correct CSS class for each category', () => {
    expect(component.getCatClass('MAQUINARIA_PESADA')).toBe('badge-cat-maquinaria');
    expect(component.getCatClass('VEHICULOS_PESADOS')).toBe('badge-cat-pesado');
    expect(component.getCatClass('VEHICULOS_LIVIANOS')).toBe('badge-cat-liviano');
    expect(component.getCatClass('EQUIPOS_MENORES')).toBe('badge-cat-menor');
  });

  // ─── Edit Flow ────────────────────────────────────────────────────────────────

  it('should set editState when editar() is called', () => {
    component.editar(mockConfigs[0]);
    expect(component.editState).toEqual({ tipoEquipoId: 1, horas: 0.5 });
  });

  it('should clear editState when cancelar() is called', () => {
    component.editar(mockConfigs[0]);
    component.cancelar();
    expect(component.editState).toBeNull();
  });

  it('should show validation error when horas is negative', () => {
    component.editar(mockConfigs[0]);
    component.editState!.horas = -1;
    component.guardar();
    expect(component.saveError).toBeTruthy();
    expect(mockService.actualizar).not.toHaveBeenCalled();
  });

  it('should call actualizar and update configs on successful save', () => {
    const updated = { ...mockConfigs[0], horas_precalentamiento: 0.75 };
    mockService.actualizar.and.returnValue(of(updated));

    component.editar(mockConfigs[0]);
    component.editState!.horas = 0.75;
    component.guardar();

    expect(mockService.actualizar).toHaveBeenCalledWith(1, 0.75);
    expect(component.configs[0].horas_precalentamiento).toBe(0.75);
    expect(component.editState).toBeNull();
    expect(component.saveSuccess).toBeTrue();
  });

  it('should show error message on failed save', () => {
    mockService.actualizar.and.returnValue(
      throwError(() => ({ error: { error: { message: 'Not found' } } }))
    );

    component.editar(mockConfigs[0]);
    component.guardar();

    expect(component.saveError).toBe('Not found');
  });

  it('should not call guardar() when editState is null', () => {
    component.editState = null;
    component.guardar();
    expect(mockService.actualizar).not.toHaveBeenCalled();
  });
});
