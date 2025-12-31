import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MainNavComponent } from './main-nav.component';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, MainNavComponent],
  template: `
    <div class="coming-soon-container">
      <app-main-nav></app-main-nav>
      
      <div class="coming-soon-content">
        <div class="coming-soon-card">
          <div class="icon">🚧</div>
          <h1>{{ moduleTitle }}</h1>
          <p class="subtitle">Este módulo está en desarrollo</p>
          <p class="description">
            Estamos trabajando para traerte esta funcionalidad pronto.
            Por favor, vuelve a consultar más tarde.
          </p>
          <button class="btn-back" (click)="goBack()">
            ← Volver al Panel de Control
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .coming-soon-container {
      min-height: 100vh;
      background: #f5f7fa;
    }

    .coming-soon-content {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 80px);
      padding: var(--spacing-xl);
    }

    .coming-soon-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--spacing-3xl);
      max-width: 600px;
      text-align: center;
      box-shadow: var(--shadow-lg);
    }

    .icon {
      font-size: 80px;
      margin-bottom: var(--spacing-lg);
    }

    h1 {
      font-size: 32px;
      font-weight: 700;
      color: var(--primary-900);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .subtitle {
      font-size: 20px;
      font-weight: 500;
      color: var(--grey-700);
      margin: 0 0 var(--spacing-lg) 0;
    }

    .description {
      font-size: 16px;
      color: var(--grey-500);
      line-height: 1.6;
      margin: 0 0 var(--spacing-2xl) 0;
    }

    .btn-back {
      background: var(--primary-500);
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: var(--radius-sm);
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--primary-900);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
    }

    @media (max-width: 768px) {
      .coming-soon-card {
        padding: var(--spacing-2xl);
      }

      .icon {
        font-size: 64px;
      }

      h1 {
        font-size: 24px;
      }

      .subtitle {
        font-size: 18px;
      }

      .description {
        font-size: 14px;
      }
    }
  `]
})
export class ComingSoonComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  moduleTitle = 'Módulo en Desarrollo';

  constructor() {
    // Get module title from route data
    this.route.data.subscribe(data => {
      if (data['title']) {
        this.moduleTitle = data['title'];
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
