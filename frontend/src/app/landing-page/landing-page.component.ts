import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
})
export class LandingPageComponent {
  currentLang: 'es' | 'en' = 'es';

  content = {
    es: {
      nav: {
        home: 'Inicio',
        features: 'Características',
        pricing: 'Precios',
        contact: 'Contacto',
        login: 'Iniciar Sesión',
        lang: 'English',
      },
      hero: {
        title: 'Optimice su Gestión de Equipos de Construcción',
        subtitle:
          'La plataforma integral para maximizar la eficiencia y reducir costos en proyectos de ingeniería civil.',
        cta: 'Solicitar Demo',
        secondary: 'Ver Video',
      },
      features: {
        title: 'Todo lo que necesita para el control total',
        list: [
          {
            title: 'Gestión de Flota',
            desc: 'Monitoreo en tiempo real de ubicación y estado de maquinaria pesada.',
            icon: 'fa-truck-front',
          },
          {
            title: 'Reportes Móviles',
            desc: 'Partes diarios digitales desde el campo, sin papeleo y al instante.',
            icon: 'fa-mobile-screen',
          },
          {
            title: 'Control de Costos',
            desc: 'Análisis detallado de rentabilidad y mantenimiento predictivo.',
            icon: 'fa-chart-line',
          },
        ],
      },
      showcase: {
        title: 'Diseñado para el Campo y la Oficina',
        desc: 'Una experiencia unificada que conecta a operadores, ingenieros y gerentes.',
      },
      pricing: {
        title: 'Planes Flexibles',
        contact: 'Para planes personalizados',
        tiers: [
          {
            name: 'Básico',
            price: 'Consultar',
            features: ['Hasta 5 equipos', 'Reportes básicos', 'Soporte email'],
          },
          {
            name: 'Profesional',
            price: 'Consultar',
            features: ['Hasta 20 equipos', 'Analíticas avanzadas', 'Soporte prioritario'],
          },
          {
            name: 'Empresarial',
            price: 'A Medida',
            features: ['Flota ilimitada', 'API Access', 'Gerente de cuenta dedicado'],
          },
        ],
      },
      contact: {
        title: 'Hablemos de su Proyecto',
        email: 'contacto@bitcorp-erp.com',
        placeholder: 'ejemplo@empresa.com',
      },
      footer: {
        rights: '© 2024 Bitcorp ERP. Todos los derechos reservados.',
      },
    },
    en: {
      nav: {
        home: 'Home',
        features: 'Features',
        pricing: 'Pricing',
        contact: 'Contact',
        login: 'Login',
        lang: 'Español',
      },
      hero: {
        title: 'Optimize Your Construction Equipment Management',
        subtitle:
          'The comprehensive platform to maximize efficiency and reduce costs in civil engineering projects.',
        cta: 'Request Demo',
        secondary: 'Watch Video',
      },
      features: {
        title: 'Everything you need for total control',
        list: [
          {
            title: 'Fleet Management',
            desc: 'Real-time monitoring of heavy machinery location and status.',
            icon: 'fa-truck-front',
          },
          {
            title: 'Mobile Reporting',
            desc: 'Digital daily reports from the field, paperless and instant.',
            icon: 'fa-mobile-screen',
          },
          {
            title: 'Cost Control',
            desc: 'Detailed profitability analysis and predictive maintenance.',
            icon: 'fa-chart-line',
          },
        ],
      },
      showcase: {
        title: 'Designed for Field and Office',
        desc: 'A unified experience connecting operators, engineers, and managers.',
      },
      pricing: {
        title: 'Flexible Plans',
        contact: 'For custom plans',
        tiers: [
          {
            name: 'Basic',
            price: 'Contact Us',
            features: ['Up to 5 units', 'Basic reporting', 'Email support'],
          },
          {
            name: 'Professional',
            price: 'Contact Us',
            features: ['Up to 20 units', 'Advanced analytics', 'Priority support'],
          },
          {
            name: 'Enterprise',
            price: 'Custom',
            features: ['Unlimited fleet', 'API Access', 'Dedicated account manager'],
          },
        ],
      },
      contact: {
        title: "Let's Talk About Your Project",
        email: 'contact@bitcorp-erp.com',
        placeholder: 'example@company.com',
      },
      footer: {
        rights: '© 2024 Bitcorp ERP. All rights reserved.',
      },
    },
  };

  constructor(private router: Router) {}

  toggleLang() {
    this.currentLang = this.currentLang === 'es' ? 'en' : 'es';
  }

  get t() {
    return this.content[this.currentLang];
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
