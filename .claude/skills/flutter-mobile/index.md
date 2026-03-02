---
name: flutter-mobile
description: Use when working on the Flutter mobile app (mobile/ directory) - covers architecture, patterns, API integration, and conventions
---

# Flutter Mobile App - BitCorp ERP

## Project Structure

```
mobile/lib/
├── core/
│   ├── network/         # Dio client, auth interceptor
│   ├── providers/       # Global providers (project, app version)
│   ├── routing/         # GoRouter with code-gen (@TypedGoRoute)
│   ├── storage/         # SQLite (local_database.dart), secure storage
│   ├── theme/           # Aero theme (aero_theme.dart)
│   ├── utils/           # Image compression, helpers
│   └── widgets/         # Global widgets (forced update, search delegate)
├── features/
│   ├── auth/            # Login, JWT auth
│   ├── dashboard/       # Operator + Supervisor dashboards
│   ├── daily_report/    # Parte diario CRUD
│   ├── equipment/       # Equipment detail
│   ├── vouchers/        # Vale combustible
│   ├── valorizations/   # Valorizaciones list
│   ├── approvals/       # Approval hub + ad-hoc forms
│   ├── checklists/      # Inspections + incidentes
│   └── notifications/   # Push notifications
└── main.dart
```

## Key Patterns

### State Management: Riverpod (code-gen)

```dart
@riverpod
Future<List<Model>> featureList(Ref ref) async {
  final repo = ref.watch(featureRepositoryProvider);
  return repo.getAll();
}
```

### Network: Dio Client

- Base URL: `http://localhost:3410/api`
- Auth: `AuthInterceptor` adds JWT Bearer token from secure storage
- All API responses wrapped in `{ "success": true, "data": ... }`
- Paginated responses add `"pagination": { "page", "limit", "total", "total_pages" }`

### API Response Unwrapping

```dart
// Standard list endpoint
final response = await _dio.get('/reports/');
final data = (response.data['data'] as List)
    .map((e) => Model.fromJson(e as Map<String, dynamic>))
    .toList();

// Paginated endpoint
final pagination = response.data['pagination'];
```

### Models: Freezed + JsonSerializable

```dart
@freezed
abstract class MyModel with _$MyModel {
  const factory MyModel({
    required int id,  // Backend uses int IDs
    @JsonKey(name: 'snake_case_field') required String camelCaseField,
  }) = _MyModel;

  factory MyModel.fromJson(Map<String, dynamic> json) =>
      _$MyModelFromJson(json);
}
```

**Critical**: Backend DTOs use **snake_case** Spanish field names. Always use `@JsonKey(name: 'backend_field')` for mapping.

### Repository Pattern: API-first with offline fallback

```dart
class FeatureRepository {
  final Dio _dio;
  final FeatureLocalSource _localSource;

  Future<List<Model>> getAll() async {
    try {
      final response = await _dio.get('/endpoint/');
      final items = (response.data['data'] as List)
          .map((e) => Model.fromJson(e as Map<String, dynamic>))
          .toList();
      await _localSource.cacheAll(items); // Cache for offline
      return items;
    } catch (e) {
      return await _localSource.getAll(); // Offline fallback
    }
  }
}
```

### ID Types

Backend uses **int** IDs everywhere. Mobile models must use `int` (not `String`).

## Commands

```bash
# Run on Chrome (dev)
cd mobile && flutter run -d chrome --web-port=60000

# Code generation (after model changes)
cd mobile && dart run build_runner build --delete-conflicting-outputs

# Watch mode for code gen
cd mobile && dart run build_runner watch --delete-conflicting-outputs
```

## Backend Field Name Reference

All backend DTOs use Spanish snake_case. Common mappings:

| Backend (snake_case) | Mobile (camelCase) |
| -------------------- | ------------------ |
| `equipo_id`          | `equipoId`         |
| `horometro_inicio`   | `horometroInicio`  |
| `horometro_fin`      | `horometroFin`     |
| `horas_efectivas`    | `horasEfectivas`   |
| `codigo_equipo`      | `codigoEquipo`     |
| `tipo_combustible`   | `tipoCombustible`  |
| `cantidad_galones`   | `cantidadGalones`  |
| `total_valorizado`   | `totalValorizado`  |
| `total_con_igv`      | `totalConIgv`      |
| `created_at`         | `createdAt`        |
| `anio_fabricacion`   | `anioFabricacion`  |
