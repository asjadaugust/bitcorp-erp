import { Component, Input } from '@angular/core';

/**
 * A thin titled sidebar card wrapper.
 * Use as a standalone block with a title; put arbitrary content inside via ng-content.
 *
 * Usage:
 *   <entity-detail-sidebar-card title="Vigencia">
 *     <div class="timeline">...</div>
 *   </entity-detail-sidebar-card>
 */
@Component({
  selector: 'entity-detail-sidebar-card',
  standalone: true,
  template: `
    <div class="card">
      <h3 class="sidebar-card-title">{{ title }}</h3>
      <ng-content />
    </div>
  `,
  styles: [
    `
      @use 'detail-layout' as *;
    `,
  ],
})
export class EntityDetailSidebarCardComponent {
  @Input({ required: true }) title!: string;
}
