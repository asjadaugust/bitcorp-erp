import { Routes } from '@angular/router';
import { TemplateListComponent } from './template-list/template-list.component';
import { TemplateDetailComponent } from './template-detail/template-detail.component';
import { TemplateFormComponent } from './template-form/template-form.component';
import { InspectionListComponent } from './inspection-list/inspection-list.component';
import { InspectionExecuteComponent } from './inspection-execute/inspection-execute.component';
import { InspectionDetailComponent } from './inspection-detail/inspection-detail.component';

export const checklistRoutes: Routes = [
  {
    path: '',
    redirectTo: 'inspections',
    pathMatch: 'full',
  },
  {
    path: 'templates',
    component: TemplateListComponent,
  },
  {
    path: 'templates/new',
    component: TemplateFormComponent,
  },
  {
    path: 'templates/:id',
    component: TemplateDetailComponent,
  },
  {
    path: 'templates/:id/edit',
    component: TemplateFormComponent,
  },
  {
    path: 'inspections',
    component: InspectionListComponent,
  },
  {
    path: 'inspections/new',
    component: InspectionExecuteComponent,
  },
  {
    path: 'inspections/:id',
    component: InspectionDetailComponent,
  },
  {
    path: 'inspections/:id/execute',
    component: InspectionExecuteComponent,
  },
];
