import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ServiceWorkerService } from './core/services/service-worker.service';
import { WebMcpService } from './core/services/webmcp.service';
import { OfflineIndicatorComponent } from './shared/components/offline-indicator/offline-indicator.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, OfflineIndicatorComponent],
  template: `
    <app-offline-indicator></app-offline-indicator>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent implements OnInit {
  private swService = inject(ServiceWorkerService);
  private webMcpService = inject(WebMcpService);

  ngOnInit() {
    console.log('Bitcorp ERP Application started');
    console.log('Service Worker initialized');
  }
}
