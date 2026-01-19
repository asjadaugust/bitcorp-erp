# Contract Service Audit Report

**Service**: `contract.service.ts`  
**Audit Date**: 2026-01-19  
**Session**: 27  
**Auditor**: OpenCode Agent  
**Status**: ✅ READY FOR REFACTORING

---

## Executive Summary

**Service Complexity**: 🔴 Complex (Business-Critical)  
**Lines of Code**: 438 → ~1200 (estimated with documentation)  
**Methods**: 11 methods (7 public + 1 private + 3 utility)  
**Domain**: Equipment rental contract management (core business entity)

### Refactoring Scope

- ✅ Add comprehensive class-level JSDoc (400+ lines)
- ✅ Add method-level JSDoc with business rules
- ✅ Replace Logger with logger (utils/logger → config/logger.config)
- ✅ Replace generic Error with specific error classes
- ✅ Add success logging (currently only has error logging)
- ✅ DTOs already exist and are comprehensive (147 lines)
- ✅ Add tenant context TODOs (deferred to Phase 21)
- ⚠️ No test file exists (needs creation in future phase)

---

## File Structure

### Current Structure

```
backend/src/services/contract.service.ts (438 lines)
├── Lines 1-7: Imports
├── Lines 8-14: Repository getter
├── Lines 19-103: findAll method (complex filtering, pagination, sorting)
├── Lines 108-130: findById method
├── Lines 135-149: findByNumero method (private utility)
├── Lines 154-206: create method (validation, overlap check)
├── Lines 211-257: update method
├── Lines 262-276: delete method (soft delete to CANCELADO)
├── Lines 281-306: findExpiring method (contracts expiring in N days)
├── Lines 311-346: checkOverlappingContracts method (private helper)
├── Lines 351-372: getAddendums method
├── Lines 377-416: createAddendum method (extends contract)
└── Lines 421-437: getActiveCount method
```

### Related Files

- DTO file: `backend/src/types/dto/contract.dto.ts` (147 lines) ✅
- Model file: `backend/src/models/contract.model.ts`
- Test file: ❌ Does not exist (needs creation)
- Controller: `backend/src/controllers/contract.controller.ts`

---

## Methods Analysis

### 1. findAll(filters?, page, limit)

- **Lines**: 19-103 (85 lines)
- **Complexity**: High
- **Purpose**: List contracts with filtering, pagination, sorting
- **Parameters**:
  - `filters`: search, estado, equipment_id, provider_id, sort_by, sort_order
  - `page`: number (default 1)
  - `limit`: number (default 10)
- **Returns**: `Promise<{ data: ContractDto[]; total: number }>`
- **Query**: Complex QueryBuilder with LEFT JOINs (equipo, provider)
- **Filtering**: Search (numero, razon_social, modelo), estado, equipment, provider
- **Sorting**: Whitelisted fields with default to fecha_inicio DESC
- **Error Handling**: ❌ Returns empty result instead of throwing (line 101)
- **Logging**: ❌ Only errors (needs success logging)
- **Tenant Context**: ❌ Missing

**Issues Found**:

- Returns empty result on error (silently swallows errors)
- Should use DatabaseError instead of catching and returning empty
- No success logging
- No tenant filtering

### 2. findById(id: number)

- **Lines**: 108-130 (23 lines)
- **Complexity**: Low
- **Purpose**: Get single contract by ID with relations (adendas, equipo, provider)
- **Parameters**: `id: number`
- **Returns**: `Promise<ContractDto>`
- **Relations**: adendas, equipo, equipo.provider
- **Error Handling**: ❌ Generic Error('Contract not found') - needs NotFoundError
- **Logging**: ❌ Only errors (needs success logging)
- **Tenant Context**: ❌ Missing

**Issues Found**:

- Generic Error instead of NotFoundError
- No success logging

### 3. findByNumero(numeroContrato: string)

- **Lines**: 135-149 (15 lines)
- **Complexity**: Low
- **Purpose**: Get contract by numero_contrato (for uniqueness validation)
- **Parameters**: `numeroContrato: string`
- **Returns**: `Promise<Contract | null>`
- **Error Handling**: ❌ Generic throw - needs DatabaseError
- **Logging**: ❌ Only errors (needs success logging)
- **Tenant Context**: ❌ Missing
- **Visibility**: Public but should be private utility

**Issues Found**:

- Returns raw entity instead of DTO
- Generic error handling
- Should be private method

### 4. create(data: Partial<ContractDto>)

- **Lines**: 154-206 (53 lines)
- **Complexity**: High
- **Purpose**: Create new equipment rental contract
- **Business Rules**:
  - Validate required fields (numero_contrato, fecha_inicio, fecha_fin)
  - Validate fecha_fin > fecha_inicio
  - Check numero_contrato uniqueness
  - Check for overlapping contracts on same equipment
- **Error Handling**: ❌ Generic Error - needs ValidationError, ConflictError
- **Logging**: ❌ Only errors (needs success logging)
- **Tenant Context**: ❌ Missing

**Issues Found**:

- Generic Error for all validation failures (should use ValidationError)
- Generic Error for uniqueness (should use ConflictError)
- Generic Error for overlapping (should use BusinessRuleError)
- No success logging

### 5. update(id: number, data: Partial<ContractDto>)

- **Lines**: 211-257 (47 lines)
- **Complexity**: Medium-High
- **Purpose**: Update existing contract
- **Business Rules**:
  - Validate fecha_fin > fecha_inicio if updating dates
  - Check numero_contrato uniqueness if changing
- **Error Handling**: ❌ Generic Error - needs ValidationError, NotFoundError
- **Logging**: ❌ Only errors (needs success logging)
- **Tenant Context**: ❌ Missing

**Issues Found**:

- Uses findById which throws generic Error (should be NotFoundError)
- Generic Error for validation (should use ValidationError)
- Generic Error for uniqueness (should use ConflictError)
- No success logging

### 6. delete(id: number)

- **Lines**: 262-276 (15 lines)
- **Complexity**: Low
- **Purpose**: Soft delete contract (set estado = CANCELADO)
- **Implementation**: Good (soft delete)
- **Error Handling**: ❌ Wraps in generic Error - needs DatabaseError
- **Logging**: ❌ Only errors (needs success logging with explanation)
- **Tenant Context**: ❌ Missing

**Issues Found**:

- Generic Error wrapping (line 274)
- No check if contract exists before update
- No success logging explaining soft delete

### 7. findExpiring(days: number = 30)

- **Lines**: 281-306 (26 lines)
- **Complexity**: Medium
- **Purpose**: Get contracts expiring in N days (proactive alerts)
- **Parameters**: `days: number` (default 30)
- **Returns**: `Promise<ContractDto[]>`
- **Query**: Uses Between() for date range
- **Error Handling**: ❌ Generic throw - needs DatabaseError
- **Logging**: ❌ Only errors (needs success logging)
- **Tenant Context**: ❌ Missing

**Issues Found**:

- Generic error handling
- No success logging

### 8. checkOverlappingContracts (PRIVATE)

- **Lines**: 311-346 (36 lines)
- **Complexity**: Medium
- **Purpose**: Validate no active contract exists for equipment in date range
- **Parameters**: equipoId, fechaInicio, fechaFin, excludeContractId?
- **Returns**: `Promise<boolean>`
- **Business Logic**: Checks (fechaInicio <= :fechaFin AND fechaFin >= :fechaInicio)
- **Error Handling**: ❌ Returns false on error (silently swallows errors)
- **Logging**: ❌ Only errors
- **Visibility**: Private ✅

**Issues Found**:

- Returns false on error instead of throwing
- Should throw DatabaseError
- No success logging

### 9. getAddendums(contractId: number)

- **Lines**: 351-372 (22 lines)
- **Complexity**: Low
- **Purpose**: Get all addendums for a contract (tipo = 'ADENDA')
- **Parameters**: `contractId: number`
- **Returns**: `Promise<ContractDto[]>`
- **Query**: Find where contrato_padre_id = contractId, tipo = ADENDA
- **Error Handling**: ❌ Generic throw - needs DatabaseError
- **Logging**: ❌ Only errors (needs success logging)
- **Tenant Context**: ❌ Missing

**Issues Found**:

- Generic error handling
- No success logging

### 10. createAddendum(data: Partial<ContractDto>)

- **Lines**: 377-416 (40 lines)
- **Complexity**: High
- **Purpose**: Create contract addendum (extends end date)
- **Business Rules**:
  - Requires contrato_padre_id, numero_contrato, fecha_fin
  - New fecha_fin must be > parent contract fecha_fin
  - Updates parent contract fecha_fin
- **Transaction**: ⚠️ NO TRANSACTION (creates addendum + updates parent - not atomic!)
- **Error Handling**: ❌ Generic Error - needs ValidationError, BusinessRuleError
- **Logging**: ❌ Only errors (needs success logging)
- **Tenant Context**: ❌ Missing

**Issues Found**:

- Generic Error for validation (should use ValidationError)
- Generic Error for business rule (should use BusinessRuleError)
- NO TRANSACTION: Creates addendum and updates parent separately (can fail midway)
- No success logging

**CRITICAL ISSUE**: Missing transaction wrapper!

### 11. getActiveCount()

- **Lines**: 421-437 (17 lines)
- **Complexity**: Low
- **Purpose**: Count active contracts (dashboard metric)
- **Returns**: `Promise<number>`
- **Error Handling**: ❌ Generic throw - needs DatabaseError
- **Logging**: ❌ Only errors (needs success logging)
- **Tenant Context**: ❌ Missing

**Issues Found**:

- Generic error handling
- No success logging

---

## Critical Issues Summary

### 🔴 HIGH PRIORITY

1. **Missing Transaction in createAddendum** (line 377-416)
   - Creates addendum, then updates parent contract
   - NOT atomic - can fail midway leaving inconsistent state
   - **Fix**: Wrap in transaction using QueryRunner

2. **Silent Error Swallowing**
   - `findAll()` returns empty result on error (line 101)
   - `checkOverlappingContracts()` returns false on error (line 344)
   - **Fix**: Throw DatabaseError instead

3. **Generic Error Classes**
   - All methods use generic Error
   - **Fix**: Use NotFoundError, ValidationError, ConflictError, BusinessRuleError, DatabaseError

### 🟡 MEDIUM PRIORITY

4. **Logger Import**
   - Uses old Logger from utils/logger (line 6)
   - **Fix**: Replace with logger from config/logger.config

5. **No Success Logging**
   - All 11 methods missing success logs
   - **Fix**: Add logger.info() after successful operations

6. **findByNumero Returns Raw Entity**
   - Returns Contract entity instead of DTO (line 135)
   - Should be private method
   - **Fix**: Make private, return entity for internal use only

### 🟢 LOW PRIORITY

7. **No Test File**
   - Service has no tests
   - **Fix**: Create test file (future phase)

8. **Tenant Context Missing**
   - All queries lack tenant filtering
   - **Fix**: Add TODO comments (deferred to Phase 21)

---

## Refactoring Plan

### Step 1: Import Changes

```typescript
// OLD:
import Logger from '../utils/logger';

// NEW:
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessRuleError,
  DatabaseError,
  DatabaseErrorType,
} from '../errors';
import logger from '../config/logger.config';
```

### Step 2: Class-Level JSDoc (~400 lines)

- Purpose and criticality (core business entity)
- Contract lifecycle (BORRADOR → ACTIVO → VENCIDO/CANCELADO)
- Contract types (CONTRATO vs ADENDA)
- Financial terms (tarifa, moneda, modalidad, horas_incluidas)
- Equipment relations (equipo_id, provider)
- Date handling (fecha_contrato, fecha_inicio, fecha_fin)
- Overlap validation logic
- Addendum workflow
- Business rules (uniqueness, date validation, overlap prevention)
- Related services
- 6+ usage examples

### Step 3: Method-Level JSDoc (11 methods)

- Add @param, @returns, @throws for all methods
- Document business rules
- Add usage examples

### Step 4: Error Handling (Priority Order)

**findAll**:

- Replace empty return with DatabaseError throw

**findById**:

- Replace Error('Contract not found') with NotFoundError

**create**:

- Replace Error('required fields') with ValidationError
- Replace Error('End date must be after') with ValidationError
- Replace Error('already exists') with ConflictError
- Replace Error('overlapping contracts') with BusinessRuleError
- Wrap in try-catch with DatabaseError

**update**:

- Replace Error validations with ValidationError, ConflictError
- Wrap in try-catch with DatabaseError

**delete**:

- Add existence check with NotFoundError
- Replace Error('Failed to delete') with DatabaseError
- Wrap in try-catch

**createAddendum** (CRITICAL):

- Add transaction wrapper
- Replace Error validations with ValidationError, BusinessRuleError
- Wrap in try-catch with DatabaseError

**findExpiring, getAddendums, getActiveCount**:

- Wrap in try-catch with DatabaseError

**checkOverlappingContracts**:

- Replace false return with DatabaseError throw

**findByNumero**:

- Make private
- Wrap in try-catch with DatabaseError

### Step 5: Success Logging (11 methods)

- Add logger.info() after successful operations
- Include relevant context (id, numero_contrato, estado, etc.)

### Step 6: Tenant Context TODOs (11 methods)

- Add TODO comments for Phase 21

### Step 7: Transaction Fix (createAddendum)

```typescript
const queryRunner = AppDataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  // Create addendum
  const savedAddendum = await queryRunner.manager.save(addendum);

  // Update parent contract
  await queryRunner.manager.update(Contract, contractDto.id, {
    fechaFin: new Date(data.fecha_fin),
  });

  await queryRunner.commitTransaction();
  return toContractDto(savedAddendum);
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

---

## Business Domain Knowledge

### Contract States (estado enum)

1. **BORRADOR** (Draft)
   - Contract being prepared
   - Not yet signed or effective
   - Can be edited freely

2. **ACTIVO** (Active)
   - Contract signed and in effect
   - Equipment assigned to project/client
   - Rental charges apply
   - Generates monthly valuations

3. **VENCIDO** (Expired)
   - End date (fecha_fin) has passed
   - No longer generating charges
   - Equipment should be returned or contract renewed

4. **CANCELADO** (Cancelled)
   - Contract terminated early
   - Equipment returned
   - Final valuation completed
   - Soft delete state

### Contract Types (tipo enum)

1. **CONTRATO** (Main Contract)
   - Initial rental agreement
   - Defines base terms (tarifa, dates, conditions)
   - Can have multiple addendums
   - contrato_padre_id = NULL

2. **ADENDA** (Addendum)
   - Extension of existing contract
   - Modifies end date (fecha_fin)
   - Can modify rates or terms
   - contrato_padre_id = parent contract ID
   - Stored in same table (self-reference)

### Financial Terms

- **moneda**: Currency (PEN, USD, EUR)
- **tipo_tarifa**: Rate type (HORA, DIA, MES, FORFAIT)
- **tarifa**: Rate amount (decimal)
- **modalidad**: Rental modality (ALQUILER_SIMPLE, ALQUILER_CON_OPCION, etc.)
- **minimo_por**: Minimum billing basis (HORA, DIA, MES)
- **horas_incluidas**: Included hours per period
- **penalidad_exceso**: Penalty rate for excess hours

### Equipment Relations

- **equipo_id**: Foreign key to equipos table (required)
- **proveedor_id**: Provider owning the equipment (from equipo.provider_id)
- One equipment can have multiple contracts (sequential, not overlapping)
- Overlap validation prevents double-booking equipment

### Addendum Workflow

1. Create addendum with new fecha_fin (later than current)
2. Save addendum as separate record (tipo = ADENDA)
3. Update parent contract fecha_fin to match
4. Parent contract end date always reflects latest addendum

**CRITICAL**: Must be atomic transaction!

---

## Related Services

- **EquipmentService**: Equipment availability, status
- **ValuationService**: Monthly equipment usage valuation
- **ProjectService**: Project-contract relationships
- **ProviderService**: Provider information

---

## Test Coverage Recommendations (Future Phase)

- [ ] Create contract with valid data
- [ ] Reject contract with overlapping dates
- [ ] Reject contract with invalid date range
- [ ] Update contract fields
- [ ] Soft delete contract (estado = CANCELADO)
- [ ] Find expiring contracts
- [ ] Create addendum (with transaction)
- [ ] Reject addendum with invalid date
- [ ] Get addendums for contract
- [ ] Check overlapping contracts logic
- [ ] Count active contracts

---

## Estimated Refactoring Effort

- **Time**: 60-70 minutes
- **LOC Change**: 438 → ~1200 lines (2.7x increase)
- **Complexity**: High (transaction fix + 11 methods)
- **Risk**: Medium (transaction changes business logic)
- **Testing Required**: Manual testing + future unit tests

---

**Audit Complete** ✅  
**Ready for Refactoring**: Yes  
**Critical Issues**: 1 (missing transaction in createAddendum)  
**Total Issues**: 11 categories

**Next Step**: Begin refactoring with comprehensive JSDoc and error handling.
