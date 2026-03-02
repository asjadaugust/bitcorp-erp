# Python Backend Skill — BitCorp ERP (FastAPI + SQLAlchemy)

> **When to activate**: Any prompt involving Python backend code — routers, services, models, schemas, tests, config, or new module creation.

---

## 1. Architecture Overview

```
backend/
├── app/
│   ├── api/            # FastAPI routers (controllers)
│   ├── servicios/      # Business logic (request-scoped)
│   ├── esquemas/       # Pydantic DTOs (input/output validation)
│   ├── modelos/        # SQLAlchemy 2.0 ORM entities
│   ├── middleware/     # Error handler, request logger, tenant
│   ├── core/           # Security, exceptions, roles, DI
│   ├── config/         # Settings, database, logging, Redis
│   ├── utils/          # Response helpers
│   └── main.py         # FastAPI app entry point
├── tests/              # Pytest async tests
├── alembic/            # Database migrations (not used yet)
└── pyproject.toml
```

---

## 2. Layer Patterns

### Router (API Layer) — `app/api/<module>.py`

```python
from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.<module> import DtoCrear, DtoActualizar, DtoLista
from app.servicios.<module> import Servicio<Entity>
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter()

@router.get("/")
async def listar(usuario: UsuarioActual, db: SesionDb, page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100)) -> ORJSONResponse:
    servicio = Servicio<Entity>(db)
    items, total = await servicio.listar(usuario.id_empresa, page=page, limit=limit)
    return enviar_paginado([i.model_dump() for i in items], pagina=page, limite=limit, total=total)

@router.post("/", dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))])
async def crear(datos: DtoCrear, usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    servicio = Servicio<Entity>(db)
    item = await servicio.crear(usuario.id_empresa, datos, usuario.id_usuario)
    return enviar_creado({"id": item.id, "message": "Creado exitosamente"})
```

**Rules**:

- All endpoints `async`
- Dependency injection: `UsuarioActual`, `SesionDb` (Annotated types)
- Role auth: `dependencies=[Depends(requerir_roles(...))]`
- **Never return raw data** — always use `enviar_*` helpers
- Routes without path params (e.g., `/available`) **before** `/{id}` routes

### Service (Business Logic) — `app/servicios/<module>.py`

```python
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.excepciones import ConflictoError, NoEncontradoError
from app.esquemas.<module> import DtoLista, DtoDetalle
from app.modelos.<module> import Entity

def _a_lista_dto(e: Entity) -> DtoLista:
    """Transform Entity -> List DTO."""
    return DtoLista(id=e.id, ...)

class Servicio<Entity>:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(self, tenant_id: int, *, page: int = 1, limit: int = 10) -> tuple[list[DtoLista], int]:
        stmt = select(Entity).where(Entity.tenant_id == tenant_id)
        # count, sort, paginate...
        return [_a_lista_dto(e) for e in equipos], total

    async def obtener_por_id(self, tenant_id: int, entity_id: int) -> DtoDetalle:
        result = await self.db.execute(select(Entity).where(Entity.id == entity_id, Entity.tenant_id == tenant_id))
        entity = result.scalars().first()
        if not entity:
            raise NoEncontradoError("Entity", entity_id)
        return _a_detalle_dto(entity)
```

**Rules**:

- All methods `async`, first param `tenant_id: int` (multi-tenancy)
- Session via constructor: `self.db = db`
- SQLAlchemy `select()` builder (NOT legacy `.query()`)
- `.scalars().first()` for single, `.scalars().unique().all()` for lists with joins
- Transformer functions (`_a_lista_dto`, `_a_detalle_dto`) above the class
- Raise exceptions from `app.core.excepciones` (never return error objects)
- **Return DTOs, never raw ORM entities**

### Schema (DTOs) — `app/esquemas/<module>.py`

```python
from pydantic import BaseModel, Field

class EntityListaDto(BaseModel):
    """List DTO — minimal fields."""
    id: int
    nombre: str
    estado: str

class EntityDetalleDto(EntityListaDto):
    """Detail DTO — extends list with timestamps."""
    created_at: datetime | None = None
    updated_at: datetime | None = None

class EntityCrear(BaseModel):
    """Input DTO for POST — required fields."""
    nombre: str = Field(..., min_length=1, max_length=100)
    estado: str | None = None

class EntityActualizar(BaseModel):
    """Input DTO for PUT — all optional (partial update)."""
    nombre: str | None = None
```

**Rules**:

- All field names **Spanish snake_case** (matches DB columns)
- Detail inherits from List: `class DetalleDto(ListaDto)`
- Input DTOs: required fields `Field(...)`, optional `| None = None`
- Enums via `class X(StrEnum)`

### Model (ORM) — `app/modelos/<module>.py`

```python
from sqlalchemy import Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modelos.base import Base

class Entity(Base):
    __tablename__ = "entity"
    __table_args__ = {"schema": "schema_name"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    tenant_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
```

**Rules**:

- SQLAlchemy 2.0 `Mapped[T]` type hints
- `__table_args__ = {"schema": "<schema>"}` always set
- `ForeignKey("schema.table.column")` with full schema prefix
- `relationship()` with `lazy="joined"` for eager loading
- `server_default=func.now()` for timestamp defaults
- `tenant_id: Mapped[int]` on every business entity

---

## 3. Naming Conventions

| Context          | Style                           | Example                                   |
| ---------------- | ------------------------------- | ----------------------------------------- |
| DB columns       | Spanish snake_case              | `codigo_equipo`, `fecha_inicio`           |
| Model attributes | Spanish snake_case (same as DB) | `e.codigo_equipo`                         |
| DTO fields       | Spanish snake_case              | `codigo_equipo`, `proveedor_razon_social` |
| Service methods  | Spanish snake_case verbs        | `obtener_por_id()`, `cambiar_estado()`    |
| Router functions | Spanish snake_case verbs        | `listar_equipos()`, `crear_equipo()`      |
| Class names      | PascalCase                      | `ServicioEquipo`, `EquipoListaDto`        |
| Environment vars | UPPER_CASE                      | `DATABASE_URL`, `JWT_SECRET`              |

---

## 4. Exception Hierarchy

```
ErrorAplicacion (500)
├── SolicitudInvalidaError (400)
├── NoAutorizadoError (401)
├── ProhibidoError (403)
├── NoEncontradoError (404)
├── ConflictoError (409)
└── ReglaDeNegocioError (422)
    ├── .no_se_puede_eliminar()
    └── .estado_invalido()
```

Use `raise NoEncontradoError("Equipo", equipo_id)` — never return error dicts.

---

## 5. Response Helpers (`app/utils/respuesta.py`)

| Helper                                      | HTTP   | Response Shape                                          |
| ------------------------------------------- | ------ | ------------------------------------------------------- |
| `enviar_exito(data)`                        | 200    | `{"success": true, "data": ...}`                        |
| `enviar_creado(data)`                       | 201    | `{"success": true, "data": {"id": N}}`                  |
| `enviar_sin_contenido()`                    | 204    | `{"success": true, "data": null}`                       |
| `enviar_paginado(data, page, limit, total)` | 200    | `{"success": true, "data": [...], "pagination": {...}}` |
| `enviar_error(status, code, msg)`           | varies | `{"success": false, "error": {...}}`                    |

---

## 6. Testing Patterns

```python
@pytest.mark.asyncio
async def test_listar_items() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/<route>/")
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    assert "pagination" in resp.json()
```

**Rules**:

- All tests `@pytest.mark.asyncio` + `async def test_*()`
- Auth helper: `obtener_token_admin()` from `tests.conftest`
- `_cliente_auth()` returns `AsyncClient` with Bearer token
- Assert response structure: `status_code`, `success`, `data`/`pagination`
- Unique test data via timestamp suffix: `_TS = str(int(time.time()))[-6:]`

---

## 7. New Module Checklist

When creating a new backend module:

1. **Model** → `app/modelos/<domain>.py` (SQLAlchemy entity with `tenant_id`)
2. **Schema** → `app/esquemas/<module>.py` (List/Detail/Create/Update DTOs)
3. **Service** → `app/servicios/<module>.py` (business logic + transformers)
4. **Router** → `app/api/<module>.py` (FastAPI routes with auth)
5. **Register** → `app/api/router.py` (add `router_api.include_router(...)`)
6. **Tests** → `tests/test_<module>.py` (CRUD + edge cases)
7. **Quality gates** → `ruff check`, `mypy --strict`, `pytest`

---

## 8. Quality Gates

```bash
cd backend
python -m ruff check app/ tests/       # Linting
python -m mypy app/ --strict            # Type checking
python -m pytest tests/ -v --tb=short   # Tests (requires Docker DB + Redis)
```

---

## 9. Key Dependencies

- `SesionDb` = `Annotated[AsyncSession, Depends(obtener_sesion_db)]`
- `UsuarioActual` = `Annotated[PayloadJwt, Depends(obtener_usuario_actual)]`
- `PayloadJwt` contains: `id_usuario`, `id_empresa`, `rol`
- `requerir_roles("ADMIN", "DIRECTOR")` for role-based access

---

## 10. Database Schemas

| Schema           | Domain                                                       |
| ---------------- | ------------------------------------------------------------ |
| `equipo`         | Equipment, contracts, valuations, daily reports, maintenance |
| `rrhh`           | Workers, operators, certifications, availability             |
| `proyectos`      | Projects (EDT)                                               |
| `proveedores`    | Suppliers, quotes                                            |
| `sistema`        | Users, companies (tenant registry)                           |
| `administracion` | Cost centers                                                 |
| `public`         | Attachments, notifications                                   |
