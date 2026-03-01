---
trigger: always_on
---

# Flutter Data & API Integration Standards

**CRITICAL INSTRUCTION:** You are acting as an expert Flutter Developer. Whenever you create Dart data models, DTOs, or integrate with the backend API via Dio, you MUST strictly adhere to the following naming and architectural constraints to maintain compatibility with the backend API.

## 1. Field Naming Convention (MANDATORY SPANISH NAMES)

The backend database and API strictly use Spanish terminology. You must ALWAYS use Spanish names for your Dart models, variables, and UI bindings. Never translate these terms to English.

- **Dart Class Names:** Spanish, `PascalCase` (e.g., `ParteDiario`, `Incidente`).
- **Dart Properties/Variables:** Spanish, `camelCase` (e.g., `fechaInicio`, `horasEfectivas`, `idEmpresa`).
- **JSON Serialization (CRITICAL):** The backend API strictly uses `snake_case`. You must map the backend's JSON keys to your Dart variables using `@JsonKey` annotations.
  - _Example:_ `@JsonKey(name: 'fecha_inicio') final DateTime fechaInicio;`
- **BANNED PRACTICE:** Never invent English properties like `startDate` or `equipmentId`. Always use `fechaInicio` and `idEquipo`.

## 2. API Response Unwrapping (Dio & Repositories)

The backend never returns raw data objects. It strictly uses a standard JSON wrapper. Your Flutter API clients and Repositories must intercept and unwrap these correctly:

- **List Responses:** `{ "success": true, "data": [...], "pagination": { "page", "limit", "total", "total_pages" } }`
- **Single Item Responses:** `{ "success": true, "data": { ... } }`
- **Error Responses:** `{ "success": false, "error": { "code": string, "message": string, "details": any } }`

**Implementation Rule:** Your Flutter Repository layer must check the `success` boolean. If true, extract and parse the `data` object. If false, parse the `error` object and throw a custom Dart exception (e.g., `ApiException(message, code)`). UI components (Riverpod providers) should never deal with the raw `{ success: true }` wrapper.
