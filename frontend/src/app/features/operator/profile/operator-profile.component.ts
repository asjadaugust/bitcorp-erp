import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface OperatorProfile {
  name: string;
  id: string;
  email: string;
  phone: string;
  skills: string[];
  certifications: { name: string; expiry: string }[];
  experience: number;
  joinDate: string;
}

@Component({
  selector: 'app-operator-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container">
      <header class="profile-header">
        <h1>Mi Perfil</h1>
        <p class="subtitle">Información personal y profesional</p>
      </header>
      
      <div class="profile-content">
        <!-- Profile Card -->
        <div class="profile-card">
          <div class="profile-avatar">
            <span class="avatar-icon">👤</span>
          </div>
          <h2>{{ profile.name }}</h2>
          <p class="profile-id">ID: {{ profile.id }}</p>
          <div class="profile-stats">
            <div class="stat">
              <div class="stat-value">{{ profile.experience }}</div>
              <div class="stat-label">Años Experiencia</div>
            </div>
            <div class="stat">
              <div class="stat-value">{{ profile.skills.length }}</div>
              <div class="stat-label">Habilidades</div>
            </div>
            <div class="stat">
              <div class="stat-value">{{ profile.certifications.length }}</div>
              <div class="stat-label">Certificaciones</div>
            </div>
          </div>
        </div>
        
        <!-- Contact Information -->
        <div class="info-section">
          <h3>Información de Contacto</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-icon">📧</span>
              <div class="info-content">
                <div class="info-label">Email</div>
                <div class="info-value">{{ profile.email }}</div>
              </div>
            </div>
            <div class="info-item">
              <span class="info-icon">📱</span>
              <div class="info-content">
                <div class="info-label">Teléfono</div>
                <div class="info-value">{{ profile.phone }}</div>
              </div>
            </div>
            <div class="info-item">
              <span class="info-icon">📅</span>
              <div class="info-content">
                <div class="info-label">Fecha de Ingreso</div>
                <div class="info-value">{{ profile.joinDate }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Skills -->
        <div class="info-section">
          <h3>Habilidades y Equipos</h3>
          <div class="skills-list">
            <span *ngFor="let skill of profile.skills" class="skill-tag">
              {{ skill }}
            </span>
          </div>
        </div>
        
        <!-- Certifications -->
        <div class="info-section">
          <h3>Certificaciones</h3>
          <div class="certifications-list">
            <div *ngFor="let cert of profile.certifications" class="cert-item">
              <div class="cert-icon">📜</div>
              <div class="cert-info">
                <div class="cert-name">{{ cert.name }}</div>
                <div class="cert-expiry" [class.expired]="isExpired(cert.expiry)">
                  Vence: {{ cert.expiry }}
                </div>
              </div>
              <div class="cert-status" [class.valid]="!isExpired(cert.expiry)" [class.expired]="isExpired(cert.expiry)">
                {{ isExpired(cert.expiry) ? '⚠️ Expirada' : '✓ Vigente' }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="profile-actions">
          <button class="btn btn-secondary">
            ✏️ Editar Perfil
          </button>
          <button class="btn btn-secondary">
            🔒 Cambiar Contraseña
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }
    
    .profile-header {
      margin-bottom: 32px;
    }
    
    .profile-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: #072b45;
      margin: 0 0 8px 0;
    }
    
    .subtitle {
      font-size: 16px;
      color: #6b7280;
      margin: 0;
    }
    
    .profile-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .profile-card {
      background: linear-gradient(135deg, #0077cd 0%, #00a1de 100%);
      color: white;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 119, 205, 0.3);
    }
    
    .profile-avatar {
      width: 100px;
      height: 100px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      border: 4px solid rgba(255,255,255,0.3);
    }
    
    .avatar-icon {
      font-size: 48px;
    }
    
    .profile-card h2 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
    }
    
    .profile-id {
      margin: 0 0 24px 0;
      opacity: 0.9;
      font-size: 14px;
    }
    
    .profile-stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 32px;
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 13px;
      opacity: 0.9;
    }
    
    .info-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .info-section h3 {
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      color: #072b45;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .info-icon {
      font-size: 28px;
    }
    
    .info-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    
    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: #072b45;
    }
    
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .skill-tag {
      padding: 8px 16px;
      background: #e6f2ff;
      color: #0077cd;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .certifications-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .cert-item {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .cert-icon {
      font-size: 28px;
      margin-right: 16px;
    }
    
    .cert-info {
      flex: 1;
    }
    
    .cert-name {
      font-weight: 600;
      color: #072b45;
      margin-bottom: 4px;
    }
    
    .cert-expiry {
      font-size: 13px;
      color: #6b7280;
    }
    
    .cert-expiry.expired {
      color: #e51937;
      font-weight: 600;
    }
    
    .cert-status {
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
    }
    
    .cert-status.valid {
      background: #d1fae5;
      color: #059669;
    }
    
    .cert-status.expired {
      background: #fee2e2;
      color: #dc2626;
    }
    
    .profile-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    
    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }
    
    .btn-secondary:hover {
      background: #e5e7eb;
    }
    
    @media (max-width: 768px) {
      .profile-container {
        padding: 16px;
      }
      
      .profile-card {
        padding: 24px;
      }
      
      .profile-stats {
        gap: 20px;
      }
      
      .profile-actions {
        flex-direction: column;
      }
      
      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class OperatorProfileComponent implements OnInit {
  profile: OperatorProfile = {
    name: 'Juan Pérez',
    id: 'OP-001',
    email: 'juan.perez@bitcorp.com',
    phone: '+34 600 123 456',
    skills: [
      'Excavadora',
      'Retroexcavadora',
      'Motoniveladora',
      'Bulldozer',
      'Cargadora Frontal'
    ],
    certifications: [
      { name: 'Operador de Maquinaria Pesada', expiry: '15/06/2026' },
      { name: 'Seguridad en Construcción', expiry: '20/03/2024' },
      { name: 'Primeros Auxilios', expiry: '10/09/2025' }
    ],
    experience: 8,
    joinDate: '15/01/2020'
  };
  
  ngOnInit() {
    // TODO: Load from API
  }
  
  isExpired(dateStr: string): boolean {
    const parts = dateStr.split('/');
    const expiryDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return expiryDate < new Date();
  }
}
