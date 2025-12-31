import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fa-solid fa-user-plus"></i>
          </div>
          <div class="title-group">
            <h1>{{ isEditMode ? 'Editar Personal' : 'Nuevo Personal' }}</h1>
            <p class="subtitle">{{ isEditMode ? 'Actualizar información del personal' : 'Registrar un nuevo empleado en el sistema' }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">Cancelar</button>
          <button type="submit" form="employeeForm" class="btn btn-primary" [disabled]="employeeForm.invalid || submitting">
            <i class="fa-solid fa-save" *ngIf="!submitting"></i>
            <span class="spinner-sm" *ngIf="submitting"></span>
            {{ submitting ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>

      <div class="form-container">
        <form id="employeeForm" [formGroup]="employeeForm" (ngSubmit)="onSubmit()">
          <!-- Personal Info -->
          <div class="form-section">
            <h2 class="section-title">Información Personal</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="dni">DNI / C.EXT <span class="required">*</span></label>
                <input id="dni" type="text" formControlName="dni" [class.error]="isFieldInvalid('dni')" maxlength="20">
                <div class="error-message" *ngIf="isFieldInvalid('dni')">DNI es requerido</div>
              </div>
              <div class="form-group">
                <label for="firstName">Nombres <span class="required">*</span></label>
                <input id="firstName" type="text" formControlName="firstName" [class.error]="isFieldInvalid('firstName')">
                <div class="error-message" *ngIf="isFieldInvalid('firstName')">Nombre es requerido</div>
              </div>
              <div class="form-group">
                <label for="lastName">Apellidos <span class="required">*</span></label>
                <input id="lastName" type="text" formControlName="lastName" [class.error]="isFieldInvalid('lastName')">
                <div class="error-message" *ngIf="isFieldInvalid('lastName')">Apellido es requerido</div>
              </div>
              <div class="form-group">
                <label for="birthDate">Fecha Nacimiento</label>
                <input id="birthDate" type="date" formControlName="birthDate">
              </div>
              <div class="form-group">
                <label for="gender">Sexo</label>
                <select id="gender" formControlName="gender">
                  <option value="">Seleccionar</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                </select>
              </div>
              <div class="form-group">
                <label for="bloodType">Tipo de Sangre</label>
                <select id="bloodType" formControlName="bloodType">
                  <option value="">Seleccionar</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Contact Info -->
          <div class="form-section">
            <h2 class="section-title">Contacto</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="mobile1">Celular 1</label>
                <input id="mobile1" type="text" formControlName="mobile1">
              </div>
              <div class="form-group">
                <label for="mobile2">Celular 2</label>
                <input id="mobile2" type="text" formControlName="mobile2">
              </div>
              <div class="form-group">
                <label for="email1">Email Personal</label>
                <input id="email1" type="email" formControlName="email1">
              </div>
              <div class="form-group">
                <label for="email2">Email Corporativo</label>
                <input id="email2" type="email" formControlName="email2">
              </div>
            </div>
          </div>

          <!-- Sizes -->
          <div class="form-section">
            <h2 class="section-title">Tallas y EPP</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="shoeSize">Talla Zapato</label>
                <input id="shoeSize" type="text" formControlName="shoeSize">
              </div>
              <div class="form-group">
                <label for="pantsSize">Talla Pantalón</label>
                <input id="pantsSize" type="text" formControlName="pantsSize">
              </div>
              <div class="form-group">
                <label for="shirtSize">Talla Camisa</label>
                <input id="shirtSize" type="text" formControlName="shirtSize">
              </div>
            </div>
          </div>

          <!-- Observations -->
          <div class="form-section">
            <h2 class="section-title">Observaciones</h2>
            <div class="form-group full-width">
              <textarea id="observation" formControlName="observation" rows="4"></textarea>
            </div>
          </div>


        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: var(--s-32);
      background: var(--grey-100);
      min-height: 100vh;
    }
    .page-header { 
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--s-24); 
    }
    .header-content {
      display: flex;
      align-items: center;
      gap: var(--s-16);
    }
    .icon-wrapper {
      width: 48px; height: 48px; background: var(--primary-100); color: var(--primary-800);
      border-radius: var(--s-12); display: flex; align-items: center; justify-content: center; font-size: 20px;
    }
    .title-group h1 { margin: 0; font-size: 24px; color: var(--grey-900); }
    .subtitle { margin: 0; color: var(--grey-500); font-size: 14px; }
    .header-actions {
      display: flex;
      gap: var(--s-12);
    }

    .form-container { max-width: 800px; margin: 0 auto; }
    .form-section {
      background: var(--neutral-0); border-radius: var(--s-8); box-shadow: var(--shadow-sm);
      padding: var(--s-24); margin-bottom: var(--s-24);
    }
    .section-title {
      font-size: var(--type-h4-size); color: var(--primary-900); margin-bottom: var(--s-16);
      padding-bottom: var(--s-8); border-bottom: 1px solid var(--grey-200);
    }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--s-16); }
    .full-width { grid-column: 1 / -1; }
    .form-group { margin-bottom: var(--s-16); }
    .form-group label { display: block; margin-bottom: var(--s-8); font-weight: 600; color: var(--grey-700); }
    .required { color: var(--semantic-error); }
    input, select, textarea {
      width: 100%; padding: var(--s-12); border: 1px solid var(--grey-300); border-radius: var(--s-4);
      font-size: var(--type-body-size); transition: border-color 0.2s;
    }
    input:focus, select:focus, textarea:focus { outline: none; border-color: var(--primary-500); }
    input.error, select.error { border-color: var(--semantic-error); }
    .error-message { color: var(--semantic-error); font-size: var(--type-label-size); margin-top: var(--s-4); }

    .btn {
      padding: var(--s-12) var(--s-24); border: none; border-radius: var(--s-4);
      font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: var(--s-8);
    }
    .btn-primary { background: var(--primary-500); color: var(--neutral-0); }
    .btn-primary:disabled { background: var(--grey-300); cursor: not-allowed; }
    .btn-secondary { background: var(--neutral-0); border: 1px solid var(--grey-300); color: var(--grey-700); }
    .spinner-sm {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class EmployeeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  employeeForm: FormGroup;
  isEditMode = false;
  employeeDni: string | null = null;
  submitting = false;

  constructor() {
    this.employeeForm = this.fb.group({
      dni: ['', [Validators.required, Validators.minLength(8)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: [''],
      gender: [''],
      mobile1: [''],
      mobile2: [''],
      email1: ['', Validators.email],
      email2: ['', Validators.email],
      bloodType: [''],
      shoeSize: [''],
      pantsSize: [''],
      shirtSize: [''],
      observation: ['']
    });
  }

  ngOnInit(): void {
    this.employeeDni = this.route.snapshot.paramMap.get('id');
    if (this.employeeDni) {
      this.isEditMode = true;
      this.employeeForm.get('dni')?.disable(); // Cannot change DNI in edit mode
      this.loadEmployee(this.employeeDni);
    }
  }

  loadEmployee(dni: string): void {
    this.employeeService.getEmployeeByDni(dni).subscribe({
      next: (employee) => {
        this.employeeForm.patchValue(employee);
      },
      error: (err) => console.error('Error loading employee', err)
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.employeeForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const employeeData = this.employeeForm.getRawValue();

    const request = this.isEditMode && this.employeeDni
      ? this.employeeService.updateEmployee(this.employeeDni, employeeData)
      : this.employeeService.createEmployee(employeeData);

    request.subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/rrhh/employees']);
      },
      error: (err) => {
        console.error('Error saving employee', err);
        this.submitting = false;
        alert('Error al guardar el personal. Verifique los datos.');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/rrhh/employees']);
  }
}
