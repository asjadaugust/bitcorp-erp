import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudMaterialService, Categoria } from './solicitud-material.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../core/design-system/data-grid/aero-data-grid.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import { LOGISTICS_TABS } from '../logistics-tabs';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [CommonModule, AeroDataGridComponent, PageLayoutComponent, PageCardComponent],
  template: `
    <app-page-layout
      title="Categorias"
      icon="fa-tags"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'categoria-list'"
          [columns]="columns"
          [data]="categorias"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [serverSide]="true"
          [totalItems]="categorias.length"
          (sortChange)="onSort($event)"
        >
        </aero-data-grid>
      </app-page-card>
    </app-page-layout>
  `,
})
export class CategoriaListComponent implements OnInit {
  private readonly solicitudService = inject(SolicitudMaterialService);

  tabs = LOGISTICS_TABS;
  categorias: Categoria[] = [];
  loading = false;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/dashboard' },
    { label: 'Logistica', url: '/logistics' },
    { label: 'Categorias' },
  ];

  columns: DataGridColumn[] = [
    {
      key: 'codigo',
      label: 'Codigo',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      key: 'nombre',
      label: 'Nombre',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      key: 'descripcion',
      label: 'Descripcion',
      type: 'text',
      sortable: true,
    },
  ];

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.loading = true;
    this.solicitudService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.loading = false;
      },
      error: () => {
        this.categorias = [];
        this.loading = false;
      },
    });
  }

  onSort(_event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }
}
