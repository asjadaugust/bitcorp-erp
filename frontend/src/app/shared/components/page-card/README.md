# PageCardComponent

A reusable card container component for consistent page layouts across the application.

## Usage

### Basic Card

```typescript
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';

@Component({
  imports: [PageCardComponent],
  template: `
    <app-page-card>
      <p>Your content here</p>
    </app-page-card>
  `
})
```

### Card with Title and Subtitle

```typescript
<app-page-card 
  title="User Profile" 
  subtitle="Manage your personal information">
  <div class="form-grid">
    <!-- Form fields -->
  </div>
</app-page-card>
```

### Card with Header Actions

```typescript
<app-page-card title="Equipment List">
  <div header-actions>
    <button class="btn btn-primary">Add New</button>
    <button class="btn btn-secondary">Export</button>
  </div>
  
  <!-- Main content -->
  <table>...</table>
</app-page-card>
```

### Card with Footer

```typescript
<app-page-card title="Form">
  <!-- Form fields -->
  <input type="text" />
  
  <div footer>
    <button class="btn btn-secondary">Cancel</button>
    <button class="btn btn-primary">Save</button>
  </div>
</app-page-card>
```

### Card without Padding (for tables)

```typescript
<app-page-card [noPadding]="true">
  <aero-table [columns]="columns" [data]="data"></aero-table>
</app-page-card>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | Optional card title |
| `subtitle` | `string` | `undefined` | Optional card subtitle/description |
| `noPadding` | `boolean` | `false` | Remove padding from card body (useful for tables) |

## Content Projection Slots

| Slot | Description |
|------|-------------|
| Default slot | Main card body content |
| `[header-actions]` | Actions displayed in the header (right side) |
| `[footer]` | Footer content (displayed with gray background) |

## Styling

The component uses CSS variables from the design system:
- `--radius-md`: Card border radius
- `--s-24`, `--s-16`, `--s-8`: Spacing values
- `--grey-200`, `--grey-700`: Color values
- `--primary-900`: Primary text color

## Examples

### Settings Page Tab Content

```typescript
<app-page-card>
  <div class="form-grid">
    <div class="form-group">
      <label>Language</label>
      <select class="form-control">
        <option>English</option>
        <option>Spanish</option>
      </select>
    </div>
  </div>
  
  <div footer>
    <button class="btn btn-primary">Save Preferences</button>
  </div>
</app-page-card>
```

### Data Table

```typescript
<app-page-card [noPadding]="true">
  <aero-table 
    [columns]="columns" 
    [data]="filteredData"
    [actionsTemplate]="actions">
  </aero-table>
</app-page-card>
```

### Dashboard Widget

```typescript
<app-page-card 
  title="Recent Activity" 
  subtitle="Your latest actions">
  <div header-actions>
    <button class="btn-icon" title="Refresh">
      <i class="fa-solid fa-refresh"></i>
    </button>
  </div>
  
  <ul class="activity-list">
    <li *ngFor="let activity of activities">
      {{ activity.description }}
    </li>
  </ul>
</app-page-card>
```

## Migration Guide

### Before (Old Pattern)

```html
<div class="settings-card">
  <div class="card-header">
    <h2>Profile Settings</h2>
    <p>Manage your profile information</p>
  </div>
  <div class="card-body">
    <!-- Content -->
  </div>
</div>
```

### After (New Pattern)

```html
<app-page-card 
  title="Profile Settings" 
  subtitle="Manage your profile information">
  <!-- Content -->
</app-page-card>
```

## Benefits

1. **Consistency**: All cards look and behave the same across the app
2. **Less Code**: No need to repeat card structure HTML
3. **Maintainability**: Change card styling in one place
4. **Accessibility**: Built-in semantic structure
5. **Flexibility**: Content projection allows customization
