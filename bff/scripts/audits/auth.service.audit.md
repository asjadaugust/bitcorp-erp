# Service Audit: auth.service.ts

**Date**: 2026-01-19  
**Service**: `backend/src/services/auth.service.ts`  
**Auditor**: OpenCode AI Agent  
**Session**: 24

---

## Service Overview

- **File**: `src/services/auth.service.ts`
- **Lines of Code**: 217 (before refactor)
- **Complexity**: 🔴 Complex
- **Scope**: Authentication (user registration, login, token refresh)
- **Domain**: Security/Identity Management
- **Has Tests**: ❌ No (needs creation)
- **Has DTOs**: ✅ Yes (`auth.dto.ts` - 64 lines)

---

## Current State Analysis

### Methods Inventory (4 methods)

1. `register(data: RegisterDto): Promise<AuthResponse>` - User registration
2. `login(data: LoginDto): Promise<AuthResponse>` - User login with credentials
3. `refreshToken(refreshToken: string): Promise<AuthResponse>` - Token refresh
4. `generateAuthResponse(user: User): AuthResponse` - Private helper (JWT generation)

### DTOs Status

✅ **DTOs exist** in `src/types/dto/auth.dto.ts`:

- `LoginDto` - username, password (with validation)
- `RegisterDto` - username, password, email, nombres, apellidos (with validation)
- `RefreshTokenDto` - refresh_token
- `AuthResponse` interface defined in service (should be in DTO file)

### Error Handling Assessment

❌ **All errors use generic `Error` class**:

- Line 52: `throw new Error('Invalid username format')`
- Line 54: `throw new Error('Invalid email format')`
- Line 58: `throw new Error('Password must be at least 8 characters...')`
- Line 69: `throw new Error('Username or email already exists')`
- Line 81: `throw new Error('Default role not found')`
- Line 125: `throw new Error('Invalid credentials')` (user not found)
- Line 142: `throw new Error('Invalid credentials')` (invalid password)
- Line 163: `throw new Error('User not found or inactive')`
- Line 168: `throw new Error('Invalid refresh token')`

**Should use**:

- `ValidationError` for input validation (username, email, password format)
- `ConflictError` for duplicate username/email
- `NotFoundError` for user/role not found
- `UnauthorizedError` for invalid credentials
- `DatabaseError` for database operations

### Logging Assessment

✅ **Some logging exists**:

- Line 98-101: Login attempt debug log
- Line 112-118: User fetch debug log
- Line 121-125: User not found warning log
- Line 131-135: Password verification debug log
- Line 138-142: Invalid password warning log
- Line 173-195: Token generation debug logs

❌ **Missing success logs**:

- No info log after successful registration
- No info log after successful login
- No info log after successful token refresh

### Return Types Assessment

✅ **Returns DTO** (`AuthResponse`):

- Consistent response structure
- User data + access_token + refresh_token

❌ **AuthResponse defined in service file**:

- Should be in `auth.dto.ts`

### Tenant Context Assessment

⚠️ **Special Case - Authentication**:

- Auth service operates on `sistema` schema (User, Role models)
- Users are NOT tenant-scoped (multi-tenant users across companies)
- No tenant filtering needed for auth operations
- **However**: Auth response should include tenant/company context

❌ **Missing tenant context in AuthResponse**:

- Should include user's company/tenant information
- Should include unidad_operativa (operational unit)

### Query Patterns Assessment

✅ **Uses QueryBuilder** for complex queries:

- Line 104-109: Login query with password selection and role joining

✅ **Uses Repository methods** for simple operations:

- Line 64-66: findOne for user existence check
- Line 76-78: findOne for default role
- Line 157-160: findOne for token refresh

### Business Rules Assessment

✅ **Validation rules**:

- Username format validation (via ValidationUtil)
- Email format validation (via ValidationUtil)
- Password strength validation (via ValidationUtil)
- Duplicate user check

✅ **Security rules**:

- Password hashing (SecurityUtil.hashPassword)
- Password comparison (SecurityUtil.comparePassword)
- JWT token generation (access + refresh)

❌ **Missing rules**:

- Account lockout after failed attempts
- Password expiry tracking
- Session management (revoke tokens)
- Multi-factor authentication support

### Transaction Usage

❌ **No transactions**:

- User creation (line 85-91) should be in transaction
- Last login update (line 146-147) could fail silently

---

## Issues Identified

### Critical Issues 🔴

1. **Generic Error Classes**
   - All errors throw generic `Error`
   - Should use: ValidationError, ConflictError, NotFoundError, UnauthorizedError, DatabaseError
   - Impact: Poor error handling in controllers, unhelpful error messages

2. **No Database Error Handling**
   - No try-catch blocks around database operations
   - Raw TypeORM errors leak to controller layer
   - Impact: System crashes on DB errors, no proper error responses

3. **Missing Success Logging**
   - No info logs for successful operations
   - Impact: No audit trail for security events (login, registration)

### High Priority Issues 🟡

4. **AuthResponse in Service File**
   - `AuthResponse` interface defined in service (line 22-32)
   - Should be in `auth.dto.ts`
   - Impact: Inconsistent DTO management

5. **No Transaction for User Creation**
   - User creation not wrapped in transaction
   - If role assignment fails, user still created
   - Impact: Data inconsistency risk

6. **Missing Tenant Context in Response**
   - AuthResponse doesn't include user's company/tenant
   - Frontend needs tenant context for routing
   - Impact: Extra API call needed after login

### Medium Priority Issues 🟢

7. **No Test Coverage**
   - No auth.service.spec.ts file
   - Critical authentication logic untested
   - Impact: High risk of regression bugs

8. **Password in RegisterDto Mismatch**
   - Service expects `first_name`, `last_name`
   - DTO has `nombres`, `apellidos`
   - Impact: Field mapping confusion

---

## Refactoring Plan

### Phase 1: Error Handling (Priority 1)

**Replace generic errors with custom errors**:

1. **ValidationError** (7 instances):
   - Invalid username format (line 52)
   - Invalid email format (line 54)
   - Invalid password format (line 58)

2. **ConflictError** (1 instance):
   - Username or email already exists (line 69)

3. **NotFoundError** (1 instance):
   - Default role not found (line 81)

4. **UnauthorizedError** (2 instances):
   - Invalid credentials - user not found (line 125)
   - Invalid credentials - wrong password (line 142)
   - User not found or inactive (line 163)
   - Invalid refresh token (line 168)

5. **DatabaseError** (wrap all queries):
   - User repository queries
   - Role repository queries
   - User save operations

### Phase 2: Success Logging (Priority 2)

**Add success logs**:

1. `register()`: Log successful registration (username, email, roles)
2. `login()`: Log successful login (username, roles)
3. `refreshToken()`: Log successful token refresh (username)

### Phase 3: Documentation (Priority 3)

**Add comprehensive JSDoc**:

1. Class-level JSDoc (250+ lines):
   - Purpose: Authentication and identity management
   - User registration workflow
   - Login workflow (credential validation, password hashing)
   - Token refresh workflow
   - JWT token structure (access vs refresh)
   - Security considerations
   - Multi-tenant context (sistema schema)
   - Related services: User, Role, UnidadOperativa
   - 5 usage examples

2. Method-level JSDoc (all 4 methods):
   - `@param` with detailed descriptions
   - `@returns` with structure
   - `@throws` with error types
   - Business rules
   - Security notes
   - Usage example

### Phase 4: DTO Cleanup (Priority 4)

**Move AuthResponse to DTO file**:

1. Move `AuthResponse` interface to `auth.dto.ts`
2. Add `export class AuthResponseDto` with validation
3. Update service imports

**Add tenant context to AuthResponse**:

1. Add `tenant_id` field
2. Add `tenant_name` field
3. Add `unidad_operativa` field

### Phase 5: Transaction Support (Priority 5)

**Wrap user creation in transaction**:

1. Use `AppDataSource.transaction()` for register method
2. Rollback if role assignment fails
3. Ensure atomicity

### Phase 6: Test Creation (Priority 6)

**Create `auth.service.spec.ts`**:

1. Mock UserRepository
2. Mock RoleRepository
3. Test successful registration
4. Test registration with duplicate username
5. Test registration with invalid email
6. Test successful login
7. Test login with invalid credentials
8. Test token refresh
9. Test refresh with invalid token
10. Aim for 80%+ coverage

---

## Standards Compliance Checklist

- [ ] **Error Handling**: Uses custom error classes (NotFoundError, ValidationError, UnauthorizedError, DatabaseError)
- [ ] **Return Types**: Returns DTOs (AuthResponse moved to DTO file)
- [ ] **Tenant Context**: N/A (sistema schema, but add tenant info to response)
- [ ] **Query Patterns**: Uses QueryBuilder for complex queries ✅
- [ ] **Logging**: Logs success (info) and errors (error) with context
- [ ] **Business Rules**: Validates business logic constraints ✅
- [ ] **Transactions**: Uses transactions for multi-step operations
- [ ] **Tests**: Has test file with 70%+ coverage
- [ ] **Documentation**: Has comprehensive class and method JSDoc

---

## Estimated Effort

- **Audit**: ✅ Complete (30 min)
- **Refactoring**: 50-60 minutes
  - Error handling: 15 min
  - Success logging: 5 min
  - Documentation: 20 min
  - DTO cleanup: 10 min
  - Transaction support: 10 min
- **Testing**: 45-60 minutes
  - Test file creation: 60 min
  - 10 tests minimum
- **Total**: 2-2.5 hours

---

## Success Criteria

✅ **Refactoring Complete When**:

- All generic errors replaced with custom error classes
- All database operations wrapped in try-catch with DatabaseError
- Success logging added for all operations
- Comprehensive class-level JSDoc (250+ lines)
- Method-level JSDoc for all 4 methods
- AuthResponse moved to DTO file
- User creation wrapped in transaction
- Test file created with 70%+ coverage
- All tests passing
- Build successful
- No regressions

---

## Notes

- **Special Case**: Auth service operates on `sistema` schema (not tenant-scoped)
- **Security Critical**: This service handles authentication - thorough testing essential
- **JWT Tokens**: Access token (short-lived) vs Refresh token (long-lived)
- **Password Security**: Uses bcrypt hashing (SecurityUtil.hashPassword)
- **Field Mismatch**: RegisterDto has `nombres`/`apellidos`, service expects `first_name`/`last_name`

---

## Related Files

- Service: `src/services/auth.service.ts`
- DTOs: `src/types/dto/auth.dto.ts`
- Models: `src/models/user.model.ts`, `src/models/role.model.ts`
- Utils: `src/utils/security.util.ts`, `src/utils/validation.util.ts`
- Tests: `src/services/auth.service.spec.ts` (to be created)
- Errors: `src/errors/index.ts`

---

**Baseline Service**: equipment.service.ts (Session 21)  
**Previous Session**: payment-schedule.service.ts (Session 23)  
**Next Session**: reporting.service.ts (Session 25)
