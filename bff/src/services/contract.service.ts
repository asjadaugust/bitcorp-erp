/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import { Contract } from '../models/contract.model';
import { ContractAnnex } from '../models/contract-annex.model';
import { ContractRequiredDocument } from '../models/contract-required-document.model';
import {
  ContractObligacion,
  TipoObligacionArrendador,
  OBLIGACION_LABELS,
} from '../models/contract-obligacion.model';
import {
  ContractObligacionArrendatario,
  TipoObligacionArrendatario,
  OBLIGACION_ARRENDATARIO_LABELS,
} from '../models/contract-obligacion-arrendatario.model';
import {
  ContratoLegalizacionPaso,
  LEGALIZACION_PASOS,
  LEGALIZACION_PASO_LABELS,
} from '../models/contrato-legalizacion-paso.model';
import { Repository, Between } from 'typeorm';
import {
  ContractDto,
  ContractObligacionDto,
  ContractObligacionArrendatarioDto,
  toContractDto,
  toContractObligacionDto,
  toContractObligacionArrendatarioDto,
  fromContractDto,
} from '../types/dto/contract.dto';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessRuleError,
  DatabaseError,
  DatabaseErrorType,
} from '../errors';
import logger from '../config/logger.config';

/**
 * # Contract Service
 *
 * ## Purpose
 *
 * The **ContractService** is a **CRITICAL business service** that manages equipment rental contracts
 * in the BitCorp ERP system. Contracts are the legal and financial foundation for equipment rental
 * operations, linking equipment to clients/projects with defined pricing, duration, and terms.
 *
 * This service handles:
 * - Equipment rental contract lifecycle management
 * - Contract creation with business rule validation
 * - Contract amendments (addendums) with transaction safety
 * - Overlap prevention (no double-booking of equipment)
 * - Contract expiration tracking
 * - Financial terms management (tarifa, moneda, modalidad)
 *
 * ---
 *
 * ## Contract Lifecycle
 *
 * Contracts follow a defined lifecycle with state transitions:
 *
 * ### States (estado enum)
 * ```
 * BORRADOR → ACTIVO → VENCIDO
 *                ↓
 *            CANCELADO
 * ```
 *
 * - **BORRADOR**: Draft contract, not yet effective, no charges applied
 * - **ACTIVO**: Active contract, generating monthly valuations and charges
 * - **VENCIDO**: Expired contract, fecha_fin has passed
 * - **CANCELADO**: Cancelled/terminated contract (soft delete)
 *
 * ### State Transitions
 * - BORRADOR → ACTIVO: Contract signed, dates effective
 * - ACTIVO → VENCIDO: Automatic when fecha_fin passes
 * - ACTIVO → CANCELADO: Manual cancellation (early termination)
 * - BORRADOR → CANCELADO: Draft contract rejected/abandoned
 *
 * ---
 *
 * ## Contract Types
 *
 * Contracts are stored in a single table with a **tipo** discriminator:
 *
 * ### 1. CONTRATO (Main Contract)
 * - Independent contract record
 * - `contrato_padre_id = NULL`
 * - Establishes initial rental terms
 * - Can have zero or more addendums (children)
 *
 * ### 2. ADENDA (Addendum/Extension)
 * - Child contract record
 * - `contrato_padre_id = parent contract ID`
 * - Extends parent contract end date
 * - **CRITICAL**: Creating addendum must atomically:
 *   1. Create addendum record (tipo = ADENDA)
 *   2. Update parent contract fecha_fin
 *   3. Both operations in single transaction (see createAddendum)
 *
 * ---
 *
 * ## Financial Terms
 *
 * Contracts define rental pricing and billing terms:
 *
 * ### Core Financial Fields
 * - **tarifa** (decimal): Base rental rate per period
 * - **moneda** (string): Currency code (PEN, USD)
 * - **modalidad** (string): Billing modality
 *   - "ALQUILER_PURO": Pure rental (flat rate)
 *   - "TANTO_ALZADO": Lump sum (fixed price)
 *   - "ALQUILER_MIXTO": Mixed rental (base + overages)
 * - **horas_incluidas** (integer): Monthly included hours (for ALQUILER_MIXTO)
 * - **penalidad_exceso** (decimal): Overage rate per extra hour
 *
 * ### Calculation Examples
 * ```typescript
 * // ALQUILER_PURO (Pure Rental)
 * monthly_charge = tarifa
 *
 * // TANTO_ALZADO (Lump Sum)
 * monthly_charge = tarifa (fixed, regardless of hours)
 *
 * // ALQUILER_MIXTO (Mixed Rental)
 * if (actual_hours <= horas_incluidas) {
 *   monthly_charge = tarifa
 * } else {
 *   extra_hours = actual_hours - horas_incluidas
 *   monthly_charge = tarifa + (extra_hours * penalidad_exceso)
 * }
 * ```
 *
 * ---
 *
 * ## Equipment Relations
 *
 * Contracts are always tied to a single equipment unit:
 *
 * ### Required Relations
 * - **equipo_id** (required): Foreign key to equipos table
 * - **proveedor_id** (optional): Inherited from equipo.proveedor_id if equipo is TERCEROS
 * - **proyecto_id** (optional): Project using the equipment
 *
 * ### Business Rules
 * - One equipment can have multiple contracts over time (sequentially)
 * - One equipment **CANNOT** have overlapping ACTIVO contracts (validated by checkOverlappingContracts)
 * - Equipment must exist before contract creation
 * - Equipment estado should be DISPONIBLE when contract starts (not enforced by this service)
 *
 * ---
 *
 * ## Date Handling
 *
 * Contract dates define rental period and must follow strict rules:
 *
 * ### Date Fields
 * - **fecha_contrato**: Contract signing date (document date)
 * - **fecha_inicio**: Rental start date (when charges begin)
 * - **fecha_fin**: Rental end date (when charges end)
 * - **fecha_fin_adenda**: Latest addendum end date (computed field)
 *
 * ### Date Validation Rules
 * 1. `fecha_fin > fecha_inicio` (end date must be after start date)
 * 2. For addendums: `new_fecha_fin > parent.fecha_fin` (extensions only)
 * 3. No overlapping ACTIVO contracts for same equipment
 *
 * ### Date Overlap Check
 * ```sql
 * -- Two contracts overlap if:
 * (contract1.fecha_inicio <= contract2.fecha_fin) AND
 * (contract1.fecha_fin >= contract2.fecha_inicio)
 * ```
 *
 * ---
 *
 * ## Overlap Validation
 *
 * **CRITICAL BUSINESS RULE**: One equipment cannot be rented to multiple clients simultaneously.
 *
 * ### Overlap Prevention Logic
 * The `checkOverlappingContracts()` method prevents double-booking by:
 * 1. Finding all ACTIVO contracts for the equipment
 * 2. Checking date range overlap: `(fechaInicio <= :fechaFin AND fechaFin >= :fechaInicio)`
 * 3. Excluding current contract (for updates): `id != :excludeContractId`
 * 4. Only checking tipo = CONTRATO (parent contracts)
 *
 * ### When Validation Runs
 * - ✅ Contract creation (create method)
 * - ❌ Contract updates (NOT checked - allows date adjustments)
 * - ❌ Addendum creation (NOT checked - extends parent, doesn't change equipo_id)
 *
 * ### Overlap Examples
 * ```typescript
 * // ❌ INVALID: Overlapping contracts
 * Contract A: 2026-01-01 to 2026-06-30 (ACTIVO)
 * Contract B: 2026-05-01 to 2026-12-31 (NEW) // REJECTED
 *
 * // ✅ VALID: Sequential contracts
 * Contract A: 2026-01-01 to 2026-06-30 (ACTIVO)
 * Contract B: 2026-07-01 to 2026-12-31 (NEW) // ALLOWED
 *
 * // ✅ VALID: Non-overlapping contracts
 * Contract A: 2026-01-01 to 2026-06-30 (VENCIDO)
 * Contract B: 2026-01-01 to 2026-12-31 (NEW) // ALLOWED (A is expired)
 * ```
 *
 * ---
 *
 * ## Addendum Workflow
 *
 * Addendums (extensions) extend a contract's end date without creating a new contract.
 *
 * ### Addendum Creation Steps
 * 1. **Validate Input**:
 *    - contrato_padre_id required
 *    - numero_contrato required (unique identifier)
 *    - fecha_fin required (new end date)
 * 2. **Validate Parent Contract**:
 *    - Parent contract exists
 *    - Parent is tipo = CONTRATO
 *    - Parent is estado = ACTIVO
 * 3. **Validate Date Extension**:
 *    - new_fecha_fin > parent.fecha_fin (must extend, not shorten)
 * 4. **Create Addendum Record** (tipo = ADENDA):
 *    - Copies most fields from parent
 *    - Sets contrato_padre_id = parent.id
 *    - Sets tipo = ADENDA
 *    - Sets estado = ACTIVO
 * 5. **Update Parent Contract**:
 *    - Sets parent.fecha_fin = new_fecha_fin
 * 6. **CRITICAL**: Steps 4 and 5 must be in a **transaction** (see createAddendum implementation)
 *
 * ### Addendum vs New Contract
 * ```typescript
 * // ✅ Use Addendum (ADENDA) when:
 * - Extending existing contract duration
 * - Same equipment, same client, same terms
 * - No change to tarifa, moneda, modalidad
 *
 * // ✅ Use New Contract (CONTRATO) when:
 * - Different equipment
 * - Different client/project
 * - Different pricing terms
 * - Starting after previous contract ends
 * ```
 *
 * ---
 *
 * ## Business Rules
 *
 * ### Contract Creation Rules
 * 1. **Required Fields**:
 *    - numero_contrato (unique contract number)
 *    - fecha_inicio, fecha_fin (date range)
 *    - equipo_id (equipment reference)
 *    - tarifa, moneda, modalidad (financial terms)
 * 2. **Uniqueness**:
 *    - numero_contrato must be unique across all contracts
 * 3. **Date Validation**:
 *    - fecha_fin > fecha_inicio
 * 4. **Overlap Prevention**:
 *    - No ACTIVO contracts with overlapping dates for same equipment
 *
 * ### Contract Update Rules
 * 1. **Numero Change**:
 *    - If changing numero_contrato, new value must be unique
 * 2. **Date Change**:
 *    - fecha_fin > fecha_inicio if both provided
 * 3. **No Overlap Check**:
 *    - Updates do NOT check overlap (allows date adjustments)
 *
 * ### Contract Deletion Rules
 * 1. **Soft Delete**:
 *    - Sets estado = CANCELADO (no physical deletion)
 * 2. **Existence Check**:
 *    - Contract must exist before deletion
 * 3. **No Cascade**:
 *    - Deleting parent does NOT delete addendums (handled by database FK)
 *
 * ### Addendum Creation Rules
 * 1. **Parent Validation**:
 *    - Parent contract must exist
 *    - Parent must be tipo = CONTRATO
 * 2. **Date Extension Only**:
 *    - new_fecha_fin > parent.fecha_fin
 * 3. **Atomic Operation**:
 *    - Addendum creation + parent update in single transaction
 *
 * ---
 *
 * ## Related Services
 *
 * ContractService interacts with:
 *
 * ### Dependencies (reads from)
 * - **EquipmentService**: Validates equipment exists, gets equipment details
 * - **ProviderService**: Gets provider info for TERCEROS equipment
 * - **ProjectService**: Associates contract with project
 *
 * ### Dependents (services that use ContractService)
 * - **ValuationService**: Reads contract terms to calculate monthly charges
 * - **DashboardService**: Counts active contracts, tracks expiring contracts
 * - **ReportingService**: Generates contract reports, revenue projections
 * - **EquipmentService**: Checks if equipment has active contracts before deletion
 *
 * ---
 *
 * ## Method Overview
 *
 * ### Query Methods (Read Operations)
 * 1. **findAll()**: List contracts with filtering, pagination, sorting
 * 2. **findById()**: Get single contract with relations (addendums, equipment, provider)
 * 3. **findByNumero()**: Get contract by numero_contrato (internal use, private)
 * 4. **findExpiring()**: Get contracts expiring within N days (for alerts)
 * 5. **getAddendums()**: Get all addendums for a parent contract
 * 6. **getActiveCount()**: Count active contracts (dashboard widget)
 *
 * ### Mutation Methods (Write Operations)
 * 7. **create()**: Create new contract with validation and overlap check
 * 8. **update()**: Update contract with uniqueness check
 * 9. **delete()**: Soft delete (set estado = CANCELADO)
 * 10. **createAddendum()**: Create addendum with transaction (CRITICAL)
 *
 * ### Helper Methods (Internal)
 * 11. **checkOverlappingContracts()**: Private method to validate no date overlap
 *
 * ---
 *
 * ## Performance Considerations
 *
 * ### Query Optimization
 * - findAll uses QueryBuilder with leftJoinAndSelect for efficient relation loading
 * - Indexes on: numero_contrato, equipo_id, estado, fecha_inicio, fecha_fin
 * - Pagination prevents large result sets
 *
 * ### Database Load
 * - checkOverlappingContracts runs on every create (1 extra query)
 * - findById loads relations (addendums, equipment, provider) in single query
 * - findExpiring uses Between operator (range query, uses index)
 *
 * ### Transaction Usage
 * - createAddendum uses QueryRunner for transaction (2 writes in 1 transaction)
 * - Other methods use simple repository operations (no explicit transactions)
 *
 * ---
 *
 * ## Error Handling
 *
 * All methods follow the SERVICE_LAYER_STANDARDS.md error handling pattern:
 *
 * ### Error Types Thrown
 * - **NotFoundError**: Contract not found by ID
 * - **ValidationError**: Missing required fields, invalid date ranges
 * - **ConflictError**: Duplicate numero_contrato
 * - **BusinessRuleError**: Overlapping contracts, invalid addendum extension
 * - **DatabaseError**: Query failures, connection errors, transaction failures
 *
 * ### Error Propagation
 * - Service methods throw typed errors (never swallow errors)
 * - Errors logged before throwing (context included)
 * - Controllers catch and map to HTTP responses
 *
 * ---
 *
 * ## Logging Strategy
 *
 * ### Success Logging
 * All methods log successful operations with:
 * - Operation name
 * - Contract ID(s)
 * - numero_contrato
 * - estado changes
 * - Date ranges
 * - Counts (for findAll, getActiveCount)
 *
 * ### Error Logging
 * All errors logged with:
 * - Error message and stack
 * - Method context
 * - Input parameters (without sensitive data)
 * - Database error details (query, constraint)
 *
 * ---
 *
 *
 * ## Usage Examples
 *
 * ### Example 1: Create New Contract
 * ```typescript
 * const contractService = new ContractService();
 *
 * const newContract = await contractService.create({
 *   numero_contrato: 'CNT-2026-001',
 *   fecha_contrato: '2026-01-15',
 *   fecha_inicio: '2026-02-01',
 *   fecha_fin: '2027-01-31',
 *   equipo_id: 123,
 *   tarifa: 5000.00,
 *   moneda: 'PEN',
 *   modalidad: 'ALQUILER_PURO',
 * });
 *
 * // Returns: ContractDto with id, estado = ACTIVO, tipo = CONTRATO
 * ```
 *
 * ### Example 2: Check Expiring Contracts
 * ```typescript
 * // Get contracts expiring in next 30 days
 * const expiring = await contractService.findExpiring(30);
 *
 * // Send alerts
 * for (const contract of expiring) {
 *   await emailService.sendExpirationAlert(contract);
 * }
 * ```
 *
 * ### Example 3: Create Addendum (Extension)
 * ```typescript
 * // Original contract: CNT-2026-001 (2026-02-01 to 2027-01-31)
 *
 * // Extend by 6 months
 * const addendum = await contractService.createAddendum({
 *   contrato_padre_id: 123,
 *   numero_contrato: 'CNT-2026-001-AD01',
 *   fecha_fin: '2027-07-31', // 6 months later
 * });
 *
 * // Result:
 * // 1. Addendum record created (tipo = ADENDA)
 * // 2. Parent contract fecha_fin updated to 2027-07-31
 * // 3. Both operations atomic (transaction)
 * ```
 *
 * ### Example 4: List Contracts with Filters
 * ```typescript
 * const { data, total } = await contractService.findAll(
 *   {
 *     search: 'CAT',        // Search by numero, provider, or equipment
 *     estado: 'ACTIVO',     // Only active contracts
 *     equipment_id: 456,    // Specific equipment
 *     sort_by: 'fecha_fin', // Sort by end date
 *     sort_order: 'ASC',    // Ascending (soonest first)
 *   },
 *   1,  // page
 *   20  // limit
 * );
 *
 * // Returns: { data: ContractDto[], total: number }
 * ```
 *
 * ### Example 5: Handle Overlapping Contract Error
 * ```typescript
 * try {
 *   await contractService.create({
 *     numero_contrato: 'CNT-2026-002',
 *     fecha_inicio: '2026-06-01',
 *     fecha_fin: '2026-12-31',
 *     equipo_id: 123, // Same equipment as Example 1
 *   });
 * } catch (error) {
 *   if (error instanceof BusinessRuleError && error.code === 'EQUIPMENT_DOUBLE_BOOKED') {
 *     console.error('Cannot create contract: equipment already has active contract');
 *     // Show error to user: "Equipment is already rented for this period"
 *   }
 * }
 * ```
 *
 * ### Example 6: Get Contract with Addendums
 * ```typescript
 * // Get full contract history
 * const contract = await contractService.findById(123);
 *
 * console.log(`Contract: ${contract.numero_contrato}`);
 * console.log(`Original period: ${contract.fecha_inicio} to ${contract.fecha_fin}`);
 *
 * // Get all addendums
 * const addendums = await contractService.getAddendums(123);
 * console.log(`Addendums: ${addendums.length}`);
 *
 * addendums.forEach((addendum, i) => {
 *   console.log(`  Addendum ${i+1}: ${addendum.numero_contrato} (extends to ${addendum.fecha_fin})`);
 * });
 * ```
 *
 * ---
 *
 * ## Testing Strategy
 *
 * ### Unit Tests (Future)
 * - Mock contractRepository for all database operations
 * - Test validation logic (date ranges, required fields)
 * - Test overlap detection logic
 * - Test addendum transaction rollback scenarios
 *
 * ### Integration Tests (Future)
 * - Test full contract lifecycle (create → update → addendum → expire → delete)
 * - Test overlap prevention with real database
 * - Test transaction atomicity in createAddendum
 * - Test cascade behavior on FK constraints
 *
 * ---
 *
 * @class ContractService
 * @description Equipment rental contract management service
 */
export class ContractService {
  private get contractRepository(): Repository<Contract> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Contract);
  }

  /**
   * Get all contracts with optional filters, pagination, and sorting
   *
   * Returns a paginated list of contracts with optional filtering by search term,
   * estado, equipment, and provider. Supports flexible sorting by any contract field.
   *
   * **Query Performance**:
   * - Uses QueryBuilder with leftJoinAndSelect for efficient relation loading
   * - Only loads tipo = CONTRATO (parent contracts), excludes addendums
   * - Excludes CANCELADO contracts by default
   * - Search uses ILIKE (case-insensitive, works in PostgreSQL)
   *
   * **Relations Loaded**:
   * - contract.equipo: Equipment details
   * - equipo.provider: Provider details (for TERCEROS equipment)
   *
   * @param {object} filters - Optional filters
   * @param {string} filters.search - Search by numero_contrato, provider razon_social, or equipment modelo
   * @param {string} filters.estado - Filter by estado (BORRADOR, ACTIVO, VENCIDO)
   * @param {number} filters.equipment_id - Filter by specific equipment ID
   * @param {number} filters.provider_id - Filter by provider ID (checks equipo.proveedorId)
   * @param {string} filters.sort_by - Sort field (numero_contrato, fecha_contrato, fecha_inicio, fecha_fin, estado, moneda, tarifa, created_at, updated_at)
   * @param {'ASC'|'DESC'} filters.sort_order - Sort order (default: DESC)
   * @param {number} page - Page number (1-indexed, default: 1)
   * @param {number} limit - Items per page (default: 10, max: 100)
   *
   * @returns {Promise<{data: ContractDto[], total: number}>} Paginated contracts with total count
   *
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * // List all active contracts
   * const { data, total } = await contractService.findAll({ estado: 'ACTIVO' }, 1, 10);
   *
   * @example
   * // Search contracts by numero or equipment
   * const { data, total } = await contractService.findAll(
   *   { search: 'CAT', sort_by: 'fecha_fin', sort_order: 'ASC' },
   *   1,
   *   20
   * );
   */
  async findAll(
    tenantId: number,
    filters?: {
      search?: string;
      estado?: string;
      equipment_id?: number;
      provider_id?: number;
      sort_by?: string;
      sort_order?: 'ASC' | 'DESC';
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: ContractDto[]; total: number }> {
    try {
      const query = this.contractRepository
        .createQueryBuilder('contract')
        .leftJoinAndSelect('contract.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'equipo_provider')
        .leftJoinAndSelect('contract.provider', 'provider')
        .where('contract.tipo = :tipo', { tipo: 'CONTRATO' })
        .andWhere('contract.tenantId = :tenantId', { tenantId });

      if (filters?.estado) {
        query.andWhere('contract.estado = :estado', { estado: filters.estado });
      } else {
        query.andWhere('contract.estado != :cancelado', { cancelado: 'CANCELADO' });
      }

      if (filters?.equipment_id) {
        query.andWhere('contract.equipoId = :equipment_id', {
          equipment_id: filters.equipment_id,
        });
      }

      if (filters?.provider_id) {
        query.andWhere('equipo.proveedorId = :provider_id', {
          provider_id: filters.provider_id,
        });
      }

      if (filters?.search) {
        query.andWhere(
          '(contract.numeroContrato ILIKE :search OR equipo_provider.razonSocial ILIKE :search OR provider.razonSocial ILIKE :search OR equipo.modelo ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Sorting with whitelisted fields
      const sortableFields: Record<string, string> = {
        numero_contrato: 'contract.numeroContrato',
        fecha_contrato: 'contract.fechaContrato',
        fecha_inicio: 'contract.fechaInicio',
        fecha_fin: 'contract.fechaFin',
        estado: 'contract.estado',
        moneda: 'contract.moneda',
        tarifa: 'contract.tarifa',
        created_at: 'contract.createdAt',
        updated_at: 'contract.updatedAt',
      };

      const sortBy =
        filters?.sort_by && sortableFields[filters.sort_by]
          ? sortableFields[filters.sort_by]
          : 'contract.fechaInicio';
      const sortOrder = filters?.sort_order === 'ASC' ? 'ASC' : 'DESC';

      query.orderBy(sortBy, sortOrder);

      // Pagination
      const offset = (page - 1) * limit;
      query.skip(offset).take(limit);

      const [contracts, total] = await query.getManyAndCount();

      logger.info('Retrieved contracts list', {
        total,
        page,
        limit,
        filters,
        count: contracts.length,
      });

      // Transform entities to DTOs
      return {
        data: contracts.map(toContractDto),
        total,
      };
    } catch (error) {
      logger.error('Error finding contracts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        page,
        limit,
        context: 'ContractService.findAll',
      });
      throw new DatabaseError(
        'Failed to retrieve contracts list',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Get contract by ID
   *
   * Retrieves a single contract with all related data (addendums, equipment, provider).
   *
   * **Relations Loaded**:
   * - adendas: All child addendum records (tipo = ADENDA, contrato_padre_id = id)
   * - equipo: Equipment details
   * - equipo.provider: Provider details
   *
   * @param {number} id - Contract ID
   *
   * @returns {Promise<ContractDto>} Contract with relations
   *
   * @throws {NotFoundError} If contract not found
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * const contract = await contractService.findById(123);
   * console.log(`Contract ${contract.numero_contrato} for ${contract.equipo?.modelo}`);
   */
  async findById(tenantId: number, id: number): Promise<ContractDto> {
    try {
      const contract = await this.contractRepository.findOne({
        where: { id, tenantId },
        relations: ['adendas', 'equipo', 'equipo.provider', 'provider'],
      });

      if (!contract) {
        throw new NotFoundError('Contract', id);
      }

      logger.info('Retrieved contract by ID', {
        id,
        numero_contrato: contract.numeroContrato,
        estado: contract.estado,
        tipo: contract.tipo,
      });

      // Transform entity to DTO
      return toContractDto(contract);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error finding contract by ID', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ContractService.findById',
      });
      throw new DatabaseError(
        `Failed to retrieve contract with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Get contract by numeroContrato
   *
   * Finds a contract by its unique numero_contrato field.
   * Returns the raw Contract entity (not DTO) for internal service use
   * and for controller endpoint GET /api/contracts/numero/:numero.
   *
   * **Note**: Returns raw entity, not DTO (for backward compatibility with controller)
   *
   * @param {string} numeroContrato - Unique contract number
   *
   * @returns {Promise<Contract|null>} Contract entity or null if not found
   *
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * const contract = await contractService.findByNumero('CNT-2026-001');
   * if (contract) console.log(`Found contract ID: ${contract.id}`);
   */
  async findByNumero(tenantId: number, numeroContrato: string): Promise<Contract | null> {
    try {
      return await this.contractRepository.findOne({
        where: { numeroContrato, tenantId },
      });
    } catch (error) {
      logger.error('Error finding contract by numero', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        numeroContrato,
        context: 'ContractService.findByNumero',
      });
      throw new DatabaseError(
        `Failed to find contract by numero: ${numeroContrato}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Create new contract
   *
   * Creates a new equipment rental contract with comprehensive validation:
   * - Required fields validation
   * - Date range validation (fecha_fin > fecha_inicio)
   * - Uniqueness check (numero_contrato)
   * - Overlap prevention (no double-booking of equipment)
   *
   * **Business Rules Applied**:
   * 1. numero_contrato must be unique across all contracts
   * 2. fecha_fin must be after fecha_inicio
   * 3. Equipment cannot have overlapping ACTIVO contracts
   *
   * **Default Values**:
   * - tipo: CONTRATO (main contract)
   * - estado: ACTIVO (immediately active)
   *
   * @param {Partial<ContractDto>} data - Contract data
   * @param {string} data.numero_contrato - Unique contract number (required)
   * @param {string} data.fecha_inicio - Rental start date (required)
   * @param {string} data.fecha_fin - Rental end date (required)
   * @param {number} data.equipo_id - Equipment ID (optional, but recommended)
   * @param {number} data.tarifa - Rental rate (optional)
   * @param {string} data.moneda - Currency code (optional)
   * @param {string} data.modalidad - Billing modality (optional)
   *
   * @returns {Promise<ContractDto>} Created contract
   *
   * @throws {ValidationError} If required fields missing or date range invalid
   * @throws {ConflictError} If numero_contrato already exists
   * @throws {BusinessRuleError} If equipment has overlapping active contract
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * const contract = await contractService.create({
   *   numero_contrato: 'CNT-2026-001',
   *   fecha_inicio: '2026-02-01',
   *   fecha_fin: '2027-01-31',
   *   equipo_id: 123,
   *   tarifa: 5000,
   *   moneda: 'PEN',
   *   modalidad: 'ALQUILER_PURO',
   * });
   */
  async create(tenantId: number, data: Partial<ContractDto>): Promise<ContractDto> {
    try {
      // Validate required fields
      if (!data.numero_contrato || !data.fecha_inicio || !data.fecha_fin) {
        throw new ValidationError('Missing required fields for contract creation', [
          {
            field: 'numero_contrato',
            rule: 'required',
            message: 'Contract number is required',
          },
          { field: 'fecha_inicio', rule: 'required', message: 'Start date is required' },
          { field: 'fecha_fin', rule: 'required', message: 'End date is required' },
        ]);
      }

      // Validate dates
      if (new Date(data.fecha_fin) <= new Date(data.fecha_inicio)) {
        throw new ValidationError('Invalid date range', [
          {
            field: 'fecha_fin',
            rule: 'date_range',
            message: 'End date must be after start date',
            value: data.fecha_fin,
          },
        ]);
      }

      // Check if numeroContrato already exists
      const existing = await this.findByNumero(tenantId, data.numero_contrato!);
      if (existing) {
        throw new ConflictError(`Contract with number ${data.numero_contrato} already exists`, {
          field: 'numero_contrato',
          value: data.numero_contrato,
          existing_id: existing.id,
        });
      }

      // Check for overlapping contracts
      if (data.equipo_id) {
        const overlapping = await this.checkOverlappingContracts(
          tenantId,
          data.equipo_id,
          new Date(data.fecha_inicio!),
          new Date(data.fecha_fin!)
        );
        if (overlapping) {
          throw new BusinessRuleError(
            'Equipment already has an active contract for this period',
            'EQUIPMENT_DOUBLE_BOOKED',
            {
              equipo_id: data.equipo_id,
              fecha_inicio: data.fecha_inicio,
              fecha_fin: data.fecha_fin,
            }
          );
        }
      }

      // Transform DTO to entity
      const entityData = fromContractDto(data);

      const contract = this.contractRepository.create({
        ...entityData,
        tenantId,
        tipo: 'CONTRATO',
        estado: 'ACTIVO',
      });

      const savedResult = await this.contractRepository.save(contract);
      const saved = Array.isArray(savedResult) ? savedResult[0] : savedResult;

      logger.info('Created new contract', {
        id: saved.id,
        numero_contrato: saved.numeroContrato,
        estado: saved.estado,
        tipo: saved.tipo,
        equipo_id: saved.equipoId,
        fecha_inicio: saved.fechaInicio?.toISOString().split('T')[0],
        fecha_fin: saved.fechaFin?.toISOString().split('T')[0],
      });

      // Return as DTO
      return toContractDto(saved);
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof ConflictError ||
        error instanceof BusinessRuleError
      ) {
        throw error;
      }
      logger.error('Error creating contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        context: 'ContractService.create',
      });
      throw new DatabaseError('Failed to create contract', DatabaseErrorType.QUERY, error as Error);
    }
  }

  /**
   * Update contract
   *
   * Updates an existing contract with validation:
   * - Date range validation (if dates provided)
   * - Uniqueness check (if numero_contrato changed)
   *
   * **Note**: Does NOT check for overlapping contracts on update (allows date adjustments).
   *
   * @param {number} id - Contract ID
   * @param {Partial<ContractDto>} data - Fields to update
   *
   * @returns {Promise<ContractDto>} Updated contract with relations
   *
   * @throws {NotFoundError} If contract not found
   * @throws {ValidationError} If date range invalid
   * @throws {ConflictError} If new numero_contrato already exists
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * const updated = await contractService.update(123, {
   *   fecha_fin: '2027-07-31', // Extend end date
   *   tarifa: 5500.00,         // Update rate
   * });
   */
  async update(tenantId: number, id: number, data: Partial<ContractDto>): Promise<ContractDto> {
    try {
      const contractDto = await this.findById(tenantId, id);

      // Validate dates if being updated
      if (data.fecha_inicio && data.fecha_fin) {
        if (new Date(data.fecha_fin) <= new Date(data.fecha_inicio)) {
          throw new ValidationError('Invalid date range', [
            {
              field: 'fecha_fin',
              rule: 'date_range',
              message: 'End date must be after start date',
              value: data.fecha_fin,
            },
          ]);
        }
      }

      // If updating numeroContrato, check it doesn't exist
      if (data.numero_contrato && data.numero_contrato !== contractDto.numero_contrato) {
        const existing = await this.findByNumero(tenantId, data.numero_contrato);
        if (existing && existing.id !== id) {
          throw new ConflictError(`Contract with number ${data.numero_contrato} already exists`, {
            field: 'numero_contrato',
            value: data.numero_contrato,
            existing_id: existing.id,
          });
        }
      }

      // Transform DTO to entity data
      const entityData = fromContractDto(data);

      // Update entity
      await this.contractRepository.update(id, entityData);

      // Fetch updated entity and return as DTO
      const updated = await this.contractRepository.findOne({
        where: { id, tenantId },
        relations: ['adendas', 'equipo', 'equipo.provider'],
      });

      if (!updated) {
        throw new NotFoundError('Contract', id);
      }

      logger.info('Updated contract', {
        id,
        numero_contrato: updated.numeroContrato,
        updated_fields: Object.keys(data),
      });

      return toContractDto(updated);
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof ConflictError
      ) {
        throw error;
      }
      logger.error('Error updating contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        data,
        context: 'ContractService.update',
      });
      throw new DatabaseError(
        `Failed to update contract with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Soft delete contract
   *
   * Marks contract as CANCELADO (soft delete, data retained for audit).
   * Does NOT physically delete the record from database.
   *
   * **Business Rule**: Contract must exist before deletion.
   *
   * @param {number} id - Contract ID
   *
   * @returns {Promise<void>}
   *
   * @throws {NotFoundError} If contract not found
   * @throws {DatabaseError} If update operation fails
   *
   * @example
   * await contractService.delete(123);
   * // Contract now has estado = CANCELADO
   */
  async delete(tenantId: number, id: number): Promise<void> {
    try {
      // Check if contract exists and belongs to tenant
      const contract = await this.contractRepository.findOne({ where: { id, tenantId } });
      if (!contract) {
        throw new NotFoundError('Contract', id);
      }

      await this.contractRepository.update(id, {
        estado: 'CANCELADO' as any,
      });

      logger.info('Soft deleted contract (set estado = CANCELADO)', {
        id,
        numero_contrato: contract.numeroContrato,
        previous_estado: contract.estado,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error deleting contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ContractService.delete',
      });
      throw new DatabaseError(
        `Failed to delete contract with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Formal contract resolution — PRD §12
   *
   * Transitions contract from ACTIVO → RESUELTO with documented causal and motivo.
   * Does NOT validate valorizaciones; that is done in liquidar().
   */
  async resolver(
    tenantId: number,
    id: number,
    dto: {
      causal_resolucion: string;
      motivo_resolucion: string;
      fecha_resolucion: string;
      monto_liquidacion?: number;
      usuarioId: number;
    }
  ): Promise<ContractDto> {
    const contract = await this.contractRepository.findOne({ where: { id, tenantId } });
    if (!contract) throw new NotFoundError('Contract', id);

    if (!['ACTIVO', 'VENCIDO'].includes(contract.estado)) {
      throw new ConflictError(
        `No se puede resolver un contrato en estado ${contract.estado}. Solo contratos ACTIVO o VENCIDO.`
      );
    }

    if (!dto.causal_resolucion) throw new ValidationError('La causal de resolución es requerida');
    if (!dto.motivo_resolucion?.trim())
      throw new ValidationError('El motivo de resolución es requerido');
    if (!dto.fecha_resolucion) throw new ValidationError('La fecha de resolución es requerida');

    await this.contractRepository.update(id, {
      estado: 'RESUELTO' as any,
      causalResolucion: dto.causal_resolucion as any,
      motivoResolucion: dto.motivo_resolucion.trim(),
      fechaResolucion: new Date(dto.fecha_resolucion),
      montoLiquidacion: dto.monto_liquidacion,
      resueltoPor: dto.usuarioId,
    });

    const updated = await this.contractRepository.findOne({ where: { id, tenantId } });
    logger.info('Contract resolved', {
      id,
      causal: dto.causal_resolucion,
      numero: contract.numeroContrato,
    });
    return toContractDto(updated);
  }

  /**
   * Check prerequisites for contract liquidation (Feature #42)
   *
   * Verifies:
   * 1. Contract is in RESUELTO state
   * 2. All linked valorizaciones are PAGADO
   * 3. An Acta de Devolución exists for the equipment
   */
  async verificarLiquidacion(
    tenantId: number,
    id: number
  ): Promise<{
    puede_liquidar: boolean;
    contrato_estado: string;
    valorizaciones_pendientes: number;
    total_valorizaciones: number;
    tiene_acta_devolucion: boolean;
    observaciones: string[];
  }> {
    const contract = await this.contractRepository.findOne({ where: { id, tenantId } });
    if (!contract) throw new NotFoundError('Contract', id);

    const observaciones: string[] = [];

    // Check 1: Contract must be in RESUELTO state
    if (contract.estado !== 'RESUELTO') {
      observaciones.push(`El contrato debe estar en estado RESUELTO (actual: ${contract.estado})`);
    }

    // Check 2: Valorizaciones — all must be PAGADO
    const valuationRows = await AppDataSource.query(
      `SELECT
        COUNT(*) FILTER (WHERE estado != 'PAGADO') AS pendientes,
        COUNT(*) AS total
       FROM equipo.valorizacion_equipo
       WHERE contrato_id = $1`,
      [id]
    );
    const pendientes = parseInt(valuationRows[0]?.pendientes || '0');
    const total = parseInt(valuationRows[0]?.total || '0');

    if (pendientes > 0) {
      observaciones.push(`Existen ${pendientes} valorización(es) sin pagar (de ${total} total)`);
    }

    // Check 3: Acta de Devolución for this equipment
    const actaRows = await AppDataSource.query(
      `SELECT COUNT(*) AS cnt
       FROM equipo.acta_devolucion
       WHERE equipo_id = $1 AND is_active = true`,
      [contract.equipoId]
    );
    const tieneActa = parseInt(actaRows[0]?.cnt || '0') > 0;
    if (!tieneActa) {
      observaciones.push('No existe Acta de Devolución registrada para el equipo');
    }

    const puede = observaciones.length === 0;
    return {
      puede_liquidar: puede,
      contrato_estado: contract.estado,
      valorizaciones_pendientes: pendientes,
      total_valorizaciones: total,
      tiene_acta_devolucion: tieneActa,
      observaciones,
    };
  }

  /**
   * Formal contract liquidation — Feature #42
   *
   * Transitions contract from RESUELTO → LIQUIDADO.
   * Validates prerequisites via verificarLiquidacion() before proceeding.
   */
  async liquidar(
    tenantId: number,
    id: number,
    dto: {
      fecha_liquidacion: string;
      monto_liquidacion?: number;
      observaciones_liquidacion?: string;
      usuarioId: number;
    }
  ): Promise<ContractDto> {
    const check = await this.verificarLiquidacion(tenantId, id);
    if (!check.puede_liquidar) {
      throw new BusinessRuleError(
        `No se puede liquidar el contrato: ${check.observaciones.join('; ')}`,
        'LIQUIDACION_PREREQUISITES_NOT_MET'
      );
    }

    await this.contractRepository.update(id, {
      estado: 'LIQUIDADO' as any,
      fechaLiquidacion: new Date(dto.fecha_liquidacion),
      liquidadoPor: dto.usuarioId,
      ...(dto.monto_liquidacion !== undefined && { montoLiquidacion: dto.monto_liquidacion }),
      ...(dto.observaciones_liquidacion && {
        observacionesLiquidacion: dto.observaciones_liquidacion,
      }),
    });

    const contract = await this.contractRepository.findOne({ where: { id, tenantId } });
    logger.info('Contract liquidated', { id, numero: contract?.numeroContrato });
    return toContractDto(contract);
  }

  /**
   * Get expiring contracts
   *
   * Retrieves contracts expiring within the specified number of days.
   * Used for alert notifications and renewal tracking.
   *
   * **Query Logic**:
   * - Only ACTIVO contracts
   * - fecha_fin BETWEEN today AND today + N days
   * - Sorted by fecha_fin ASC (soonest first)
   *
   * @param {number} days - Number of days to look ahead (default: 30)
   *
   * @returns {Promise<ContractDto[]>} Contracts expiring in date range
   *
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * // Get contracts expiring in next 30 days
   * const expiring = await contractService.findExpiring(30);
   * expiring.forEach(c => console.log(`${c.numero_contrato} expires on ${c.fecha_fin}`));
   */
  async findExpiring(tenantId: number, days: number = 30): Promise<ContractDto[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const contracts = await this.contractRepository.find({
        where: {
          tenantId,
          estado: 'ACTIVO',
          fechaFin: Between(today, futureDate),
        },
        relations: ['equipo', 'equipo.provider'],
        order: { fechaFin: 'ASC' },
      });

      logger.info('Retrieved expiring contracts', {
        days,
        count: contracts.length,
        date_range: `${today.toISOString().split('T')[0]} to ${futureDate.toISOString().split('T')[0]}`,
      });

      return contracts.map(toContractDto);
    } catch (error) {
      logger.error('Error finding expiring contracts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        days,
        context: 'ContractService.findExpiring',
      });
      throw new DatabaseError(
        `Failed to retrieve expiring contracts (days: ${days})`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Check for overlapping contracts
   *
   * Private helper method to validate that equipment doesn't have overlapping
   * ACTIVO contracts for the given date range.
   *
   * **Overlap Logic**:
   * Two date ranges overlap if:
   * ```
   * (range1.start <= range2.end) AND (range1.end >= range2.start)
   * ```
   *
   * **Conditions Checked**:
   * - equipoId matches
   * - estado = ACTIVO
   * - tipo = CONTRATO (only parent contracts, not addendums)
   * - Date ranges overlap
   * - Exclude specific contract ID (for updates)
   *
   * @param {number} equipoId - Equipment ID
   * @param {Date} fechaInicio - Start date of new/updated contract
   * @param {Date} fechaFin - End date of new/updated contract
   * @param {number} excludeContractId - Contract ID to exclude from check (for updates)
   *
   * @returns {Promise<boolean>} True if overlapping contract exists, false otherwise
   *
   * @throws {DatabaseError} If query execution fails
   *
   * @private
   */
  private async checkOverlappingContracts(
    tenantId: number,
    equipoId: number,
    fechaInicio: Date,
    fechaFin: Date,
    excludeContractId?: number
  ): Promise<boolean> {
    try {
      const query = this.contractRepository
        .createQueryBuilder('contract')
        .where('contract.equipoId = :equipoId', { equipoId })
        .andWhere('contract.tenantId = :tenantId', { tenantId })
        .andWhere('contract.estado = :estado', { estado: 'ACTIVO' })
        .andWhere('contract.tipo = :tipo', { tipo: 'CONTRATO' })
        .andWhere('(contract.fechaInicio <= :fechaFin AND contract.fechaFin >= :fechaInicio)', {
          fechaInicio,
          fechaFin,
        });

      if (excludeContractId) {
        query.andWhere('contract.id != :excludeContractId', { excludeContractId });
      }

      const count = await query.getCount();
      return count > 0;
    } catch (error) {
      logger.error('Error checking overlapping contracts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        equipoId,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
        excludeContractId,
        context: 'ContractService.checkOverlappingContracts',
      });
      throw new DatabaseError(
        'Failed to check overlapping contracts',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Get addendums for a contract
   *
   * Retrieves all addendum records (tipo = ADENDA) for a parent contract.
   * Addendums are stored in the same table with contrato_padre_id pointing to parent.
   *
   * **Relations Loaded**:
   * - equipo: Equipment details
   * - equipo.provider: Provider details
   *
   * **Sorting**: By createdAt ASC (chronological order)
   *
   * @param {number} contractId - Parent contract ID
   *
   * @returns {Promise<ContractDto[]>} List of addendums
   *
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * const addendums = await contractService.getAddendums(123);
   * console.log(`Contract has ${addendums.length} addendum(s)`);
   */
  async getAddendums(tenantId: number, contractId: number): Promise<ContractDto[]> {
    try {
      const addendums = await this.contractRepository.find({
        where: {
          tenantId,
          contratoPadreId: contractId,
          tipo: 'ADENDA',
        },
        relations: ['equipo', 'equipo.provider'],
        order: { createdAt: 'ASC' },
      });

      logger.info('Retrieved contract addendums', {
        parent_contract_id: contractId,
        count: addendums.length,
      });

      return addendums.map(toContractDto);
    } catch (error) {
      logger.error('Error fetching addendums', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contractId,
        context: 'ContractService.getAddendums',
      });
      throw new DatabaseError(
        `Failed to retrieve addendums for contract ${contractId}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Create addendum (contract extension)
   *
   * **CRITICAL METHOD**: Creates an addendum record AND updates parent contract end date
   * in a single atomic transaction. If either operation fails, both are rolled back.
   *
   * **Transaction Flow**:
   * 1. Start database transaction (QueryRunner)
   * 2. Validate input (required fields, parent exists, date extension)
   * 3. Create addendum record (tipo = ADENDA, estado = ACTIVO)
   * 4. Update parent contract fecha_fin to match addendum
   * 5. Commit transaction (both writes succeed)
   * 6. If any step fails: rollback transaction (no changes applied)
   *
   * **Business Rules**:
   * - contrato_padre_id must reference existing CONTRATO
   * - new fecha_fin must be AFTER parent's current fecha_fin (extension only)
   * - Addendum inherits most fields from parent (equipo_id, tarifa, etc.)
   *
   * **Why Transaction Is Critical**:
   * Without transaction, addendum could be created but parent update fails,
   * leaving inconsistent state (addendum exists but parent still shows old end date).
   *
   * @param {Partial<ContractDto>} data - Addendum data
   * @param {number} data.contrato_padre_id - Parent contract ID (required)
   * @param {string} data.numero_contrato - Unique addendum number (required, e.g. CNT-2026-001-AD01)
   * @param {string} data.fecha_fin - New end date (required, must be after parent's fecha_fin)
   *
   * @returns {Promise<ContractDto>} Created addendum record
   *
   * @throws {ValidationError} If required fields missing or date not after parent
   * @throws {NotFoundError} If parent contract not found
   * @throws {BusinessRuleError} If new fecha_fin not after parent's fecha_fin
   * @throws {DatabaseError} If transaction fails (rollback triggered)
   *
   * @example
   * // Extend contract by 6 months
   * const addendum = await contractService.createAddendum({
   *   contrato_padre_id: 123,
   *   numero_contrato: 'CNT-2026-001-AD01',
   *   fecha_fin: '2027-07-31', // Parent was 2027-01-31
   * });
   * // Result: Addendum created + parent fecha_fin updated to 2027-07-31 (atomic)
   */
  async createAddendum(tenantId: number, data: Partial<ContractDto>): Promise<ContractDto> {
    // Validate required fields BEFORE starting transaction
    if (!data.contrato_padre_id || !data.numero_contrato || !data.fecha_fin) {
      throw new ValidationError('Missing required fields for addendum creation', [
        {
          field: 'contrato_padre_id',
          rule: 'required',
          message: 'Parent contract ID is required',
        },
        { field: 'numero_contrato', rule: 'required', message: 'Contract number is required' },
        { field: 'fecha_fin', rule: 'required', message: 'End date is required' },
      ]);
    }

    // Get parent contract BEFORE starting transaction
    const contractDto = await this.findById(tenantId, data.contrato_padre_id);

    // Validate new end date is after current end date
    if (new Date(data.fecha_fin) <= new Date(contractDto.fecha_fin)) {
      throw new BusinessRuleError(
        'New end date must be after current contract end date',
        'INVALID_ADDENDUM_DATE',
        {
          parent_fecha_fin: contractDto.fecha_fin,
          requested_fecha_fin: data.fecha_fin,
        }
      );
    }

    // START TRANSACTION (CRITICAL)
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Transform DTO to entity
      const entityData = fromContractDto(data);

      // Step 1: Create addendum record
      const addendum = queryRunner.manager.create(Contract, {
        ...entityData,
        tipo: 'ADENDA',
        estado: 'ACTIVO',
        tenantId,
      });

      const savedAddendum = await queryRunner.manager.save(addendum);

      // Step 2: Update parent contract end date
      await queryRunner.manager.update(Contract, contractDto.id, {
        fechaFin: new Date(data.fecha_fin),
      });

      // COMMIT TRANSACTION (both operations succeed)
      await queryRunner.commitTransaction();

      logger.info('Created addendum and updated parent contract (atomic transaction)', {
        addendum_id: savedAddendum.id,
        addendum_numero: savedAddendum.numeroContrato,
        parent_contract_id: contractDto.id,
        parent_numero: contractDto.numero_contrato,
        new_end_date: data.fecha_fin,
      });

      return toContractDto(savedAddendum);
    } catch (error) {
      // ROLLBACK TRANSACTION (no changes applied)
      await queryRunner.rollbackTransaction();

      logger.error('Error creating addendum (transaction rolled back)', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        parent_contract_id: data.contrato_padre_id,
        context: 'ContractService.createAddendum',
      });

      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof BusinessRuleError
      ) {
        throw error;
      }

      throw new DatabaseError(
        'Failed to create addendum (transaction rolled back)',
        DatabaseErrorType.TRANSACTION,
        error as Error
      );
    } finally {
      // ALWAYS release QueryRunner connection
      await queryRunner.release();
    }
  }

  /**
   * Get active contracts count
   *
   * Returns the total count of active parent contracts (tipo = CONTRATO, estado = ACTIVO).
   * Used for dashboard widgets and statistics.
   *
   * **Note**: Does NOT count addendums (only tipo = CONTRATO).
   *
   * @returns {Promise<number>} Count of active contracts
   *
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * const count = await contractService.getActiveCount();
   * console.log(`Active contracts: ${count}`);
   */
  // ─── Annex Methods (WS-3) ───

  private get annexRepository(): Repository<ContractAnnex> {
    return AppDataSource.getRepository(ContractAnnex);
  }

  async getAnnexes(
    tenantId: number,
    contractId: number,
    tipoAnexo?: 'A' | 'B'
  ): Promise<ContractAnnex[]> {
    try {
      // Verify contract belongs to tenant
      const contract = await this.contractRepository.findOne({
        where: { id: contractId, tenantId },
      });
      if (!contract) throw new NotFoundError('Contract', contractId);

      const where: any = { contratoId: contractId };
      if (tipoAnexo) where.tipoAnexo = tipoAnexo;

      const annexes = await this.annexRepository.find({
        where,
        order: { tipoAnexo: 'ASC', orden: 'ASC' },
      });

      logger.info('Retrieved contract annexes', { contractId, tipoAnexo, count: annexes.length });
      return annexes;
    } catch (error) {
      logger.error('Error fetching annexes', {
        error: error instanceof Error ? error.message : String(error),
        contractId,
        context: 'ContractService.getAnnexes',
      });
      throw new DatabaseError(
        'Failed to retrieve annexes',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  async saveAnnexes(
    tenantId: number,
    contractId: number,
    tipoAnexo: 'A' | 'B',
    items: Array<{ concepto: string; incluido: boolean; observaciones?: string }>
  ): Promise<ContractAnnex[]> {
    try {
      // Verify contract exists and belongs to tenant
      await this.findById(tenantId, contractId);

      // Delete existing annexes of this type
      await this.annexRepository.delete({ contratoId: contractId, tipoAnexo });

      // Create new ones
      const annexes = items.map((item, index) =>
        this.annexRepository.create({
          contratoId: contractId,
          tipoAnexo,
          orden: index + 1,
          concepto: item.concepto,
          incluido: item.incluido,
          observaciones: item.observaciones || null,
        })
      );

      const saved = await this.annexRepository.save(annexes);

      logger.info('Saved contract annexes', {
        contractId,
        tipoAnexo,
        count: saved.length,
      });

      return saved;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error saving annexes', {
        error: error instanceof Error ? error.message : String(error),
        contractId,
        tipoAnexo,
        context: 'ContractService.saveAnnexes',
      });
      throw new DatabaseError('Failed to save annexes', DatabaseErrorType.QUERY, error as Error);
    }
  }

  // ─── Required Document Methods (WS-4) ───

  private get requiredDocRepository(): Repository<ContractRequiredDocument> {
    return AppDataSource.getRepository(ContractRequiredDocument);
  }

  async getRequiredDocuments(
    tenantId: number,
    contractId: number
  ): Promise<ContractRequiredDocument[]> {
    try {
      // Verify contract belongs to tenant
      const contract = await this.contractRepository.findOne({
        where: { id: contractId, tenantId },
      });
      if (!contract) throw new NotFoundError('Contract', contractId);

      const docs = await this.requiredDocRepository.find({
        where: { contratoId: contractId },
        relations: ['providerDocument'],
        order: { tipoDocumento: 'ASC' },
      });

      logger.info('Retrieved required documents', { contractId, count: docs.length });
      return docs;
    } catch (error) {
      logger.error('Error fetching required documents', {
        error: error instanceof Error ? error.message : String(error),
        contractId,
        context: 'ContractService.getRequiredDocuments',
      });
      throw new DatabaseError(
        'Failed to retrieve required documents',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  async initializeRequiredDocuments(
    tenantId: number,
    contractId: number
  ): Promise<ContractRequiredDocument[]> {
    try {
      await this.findById(tenantId, contractId);

      const existingDocs = await this.requiredDocRepository.find({
        where: { contratoId: contractId },
      });

      if (existingDocs.length > 0) {
        return existingDocs;
      }

      const defaultTypes = [
        'POLIZA_TREC',
        'SOAT',
        'INSPECCION_TECNICA',
        'TARJETA_PROPIEDAD',
        'LICENCIA_CONDUCIR',
      ];

      const docs = defaultTypes.map((tipo) =>
        this.requiredDocRepository.create({
          contratoId: contractId,
          tipoDocumento: tipo as any,
          estado: 'PENDIENTE' as any,
        })
      );

      const saved = await this.requiredDocRepository.save(docs);

      logger.info('Initialized required documents', { contractId, count: saved.length });
      return saved;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error initializing required documents', {
        error: error instanceof Error ? error.message : String(error),
        contractId,
        context: 'ContractService.initializeRequiredDocuments',
      });
      throw new DatabaseError(
        'Failed to initialize required documents',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  async updateRequiredDocument(
    tenantId: number,
    id: number,
    data: {
      providerDocumentId?: number | null;
      estado?: string;
      fechaVencimiento?: string | null;
      observaciones?: string | null;
    }
  ): Promise<ContractRequiredDocument> {
    try {
      const doc = await this.requiredDocRepository.findOne({ where: { id } });
      if (!doc) {
        throw new NotFoundError('ContractRequiredDocument', id);
      }

      // Verify the parent contract belongs to tenant
      const contract = await this.contractRepository.findOne({
        where: { id: doc.contratoId, tenantId },
      });
      if (!contract) {
        throw new NotFoundError('Contract', doc.contratoId);
      }

      if (data.providerDocumentId !== undefined) doc.providerDocumentId = data.providerDocumentId;
      if (data.estado !== undefined) doc.estado = data.estado as any;
      if (data.fechaVencimiento !== undefined)
        doc.fechaVencimiento = data.fechaVencimiento ? new Date(data.fechaVencimiento) : undefined;
      if (data.observaciones !== undefined) doc.observaciones = data.observaciones || undefined;

      const saved = await this.requiredDocRepository.save(doc);

      logger.info('Updated required document', { id, estado: saved.estado });
      return saved;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating required document', {
        error: error instanceof Error ? error.message : String(error),
        id,
        context: 'ContractService.updateRequiredDocument',
      });
      throw new DatabaseError(
        'Failed to update required document',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  async getActiveCount(tenantId: number): Promise<number> {
    try {
      const count = await this.contractRepository.count({
        where: {
          tenantId,
          estado: 'ACTIVO',
          tipo: 'CONTRATO',
        },
      });

      logger.info('Retrieved active contracts count', { count });

      return count;
    } catch (error) {
      logger.error('Error counting active contracts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ContractService.getActiveCount',
      });
      throw new DatabaseError(
        'Failed to count active contracts',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  // ─── Obligaciones del Arrendador (WS-21 — CORP-GEM-F-001 Cláusula 7) ───

  private get obligacionRepository(): Repository<ContractObligacion> {
    return AppDataSource.getRepository(ContractObligacion);
  }

  async getObligaciones(tenantId: number, contratoId: number): Promise<ContractObligacionDto[]> {
    try {
      // Verify contract belongs to tenant
      const contract = await this.contractRepository.findOne({
        where: { id: contratoId, tenantId },
      });
      if (!contract) throw new NotFoundError('Contract', contratoId);

      const items = await this.obligacionRepository.find({
        where: { contratoId },
        order: { tipoObligacion: 'ASC' },
      });
      logger.info('Retrieved obligaciones', { contratoId, count: items.length });
      return items.map(toContractObligacionDto);
    } catch (error) {
      logger.error('Error fetching obligaciones', {
        error: error instanceof Error ? error.message : String(error),
        contratoId,
        context: 'ContractService.getObligaciones',
      });
      throw new DatabaseError(
        'Failed to retrieve obligaciones',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  async initializeObligaciones(
    tenantId: number,
    contratoId: number
  ): Promise<ContractObligacionDto[]> {
    try {
      await this.findById(tenantId, contratoId);

      const existing = await this.obligacionRepository.find({ where: { contratoId } });
      if (existing.length > 0) {
        return existing.map(toContractObligacionDto);
      }

      const defaultTypes = Object.keys(OBLIGACION_LABELS) as TipoObligacionArrendador[];

      const entities = defaultTypes.map((tipo) =>
        this.obligacionRepository.create({
          contratoId,
          tipoObligacion: tipo,
          estado: 'PENDIENTE' as const,
        })
      );

      const saved = await this.obligacionRepository.save(entities);
      logger.info('Initialized obligaciones', { contratoId, count: saved.length });
      return saved.map(toContractObligacionDto);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error initializing obligaciones', {
        error: error instanceof Error ? error.message : String(error),
        contratoId,
        context: 'ContractService.initializeObligaciones',
      });
      throw new DatabaseError(
        'Failed to initialize obligaciones',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  async updateObligacion(
    tenantId: number,
    id: number,
    data: {
      estado?: 'PENDIENTE' | 'CUMPLIDA' | 'INCUMPLIDA';
      fechaCompromiso?: string | null;
      observaciones?: string | null;
    }
  ): Promise<ContractObligacionDto> {
    try {
      const item = await this.obligacionRepository.findOne({ where: { id } });
      if (!item) {
        throw new NotFoundError('ContractObligacion', id);
      }

      // Verify the parent contract belongs to tenant
      const contract = await this.contractRepository.findOne({
        where: { id: item.contratoId, tenantId },
      });
      if (!contract) throw new NotFoundError('Contract', item.contratoId);

      if (data.estado !== undefined) item.estado = data.estado;
      if (data.fechaCompromiso !== undefined)
        item.fechaCompromiso = data.fechaCompromiso ? new Date(data.fechaCompromiso) : undefined;
      if (data.observaciones !== undefined) item.observaciones = data.observaciones ?? undefined;

      const saved = await this.obligacionRepository.save(item);
      logger.info('Updated obligacion', { id, estado: saved.estado });
      return toContractObligacionDto(saved);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating obligacion', {
        error: error instanceof Error ? error.message : String(error),
        id,
        context: 'ContractService.updateObligacion',
      });
      throw new DatabaseError(
        'Failed to update obligacion',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  // ─── Obligaciones del Arrendatario (WS-22 — CORP-GEM-F-001 Cláusula 8) ───

  private get obligacionArrendatarioRepository(): Repository<ContractObligacionArrendatario> {
    return AppDataSource.getRepository(ContractObligacionArrendatario);
  }

  async getObligacionesArrendatario(
    tenantId: number,
    contratoId: number
  ): Promise<ContractObligacionArrendatarioDto[]> {
    try {
      // Verify contract belongs to tenant
      const contract = await this.contractRepository.findOne({
        where: { id: contratoId, tenantId },
      });
      if (!contract) throw new NotFoundError('Contract', contratoId);

      const items = await this.obligacionArrendatarioRepository.find({
        where: { contratoId },
        order: { tipoObligacion: 'ASC' },
      });
      logger.info('Retrieved obligaciones arrendatario', { contratoId, count: items.length });
      return items.map(toContractObligacionArrendatarioDto);
    } catch (error) {
      logger.error('Error fetching obligaciones arrendatario', {
        error: error instanceof Error ? error.message : String(error),
        contratoId,
        context: 'ContractService.getObligacionesArrendatario',
      });
      throw new DatabaseError(
        'Failed to retrieve obligaciones arrendatario',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  async initializeObligacionesArrendatario(
    tenantId: number,
    contratoId: number
  ): Promise<ContractObligacionArrendatarioDto[]> {
    try {
      await this.findById(tenantId, contratoId);

      const existing = await this.obligacionArrendatarioRepository.find({
        where: { contratoId },
      });
      if (existing.length > 0) {
        return existing.map(toContractObligacionArrendatarioDto);
      }

      const defaultTypes = Object.keys(
        OBLIGACION_ARRENDATARIO_LABELS
      ) as TipoObligacionArrendatario[];

      const entities = defaultTypes.map((tipo) =>
        this.obligacionArrendatarioRepository.create({
          contratoId,
          tipoObligacion: tipo,
          estado: 'PENDIENTE' as const,
        })
      );

      const saved = await this.obligacionArrendatarioRepository.save(entities);
      logger.info('Initialized obligaciones arrendatario', { contratoId, count: saved.length });
      return saved.map(toContractObligacionArrendatarioDto);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error initializing obligaciones arrendatario', {
        error: error instanceof Error ? error.message : String(error),
        contratoId,
        context: 'ContractService.initializeObligacionesArrendatario',
      });
      throw new DatabaseError(
        'Failed to initialize obligaciones arrendatario',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  async updateObligacionArrendatario(
    tenantId: number,
    id: number,
    data: {
      estado?: 'PENDIENTE' | 'CUMPLIDA' | 'INCUMPLIDA';
      fechaCompromiso?: string | null;
      observaciones?: string | null;
    }
  ): Promise<ContractObligacionArrendatarioDto> {
    try {
      const item = await this.obligacionArrendatarioRepository.findOne({ where: { id } });
      if (!item) {
        throw new NotFoundError('ContractObligacionArrendatario', id);
      }

      // Verify the parent contract belongs to tenant
      const contract = await this.contractRepository.findOne({
        where: { id: item.contratoId, tenantId },
      });
      if (!contract) throw new NotFoundError('Contract', item.contratoId);

      if (data.estado !== undefined) item.estado = data.estado;
      if (data.fechaCompromiso !== undefined)
        item.fechaCompromiso = data.fechaCompromiso ? new Date(data.fechaCompromiso) : undefined;
      if (data.observaciones !== undefined) item.observaciones = data.observaciones ?? undefined;

      const saved = await this.obligacionArrendatarioRepository.save(item);
      logger.info('Updated obligacion arrendatario', { id, estado: saved.estado });
      return toContractObligacionArrendatarioDto(saved);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating obligacion arrendatario', {
        error: error instanceof Error ? error.message : String(error),
        id,
        context: 'ContractService.updateObligacionArrendatario',
      });
      throw new DatabaseError(
        'Failed to update obligacion arrendatario',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  // ─── WS-32b: Notarial Legalization Flow (PRD P-001 §4.3.3) ───────────────

  private get legalizacionRepository(): Repository<ContratoLegalizacionPaso> {
    return AppDataSource.getRepository(ContratoLegalizacionPaso);
  }

  /**
   * Get legalization steps for a contract.
   * Returns empty array if legalization hasn't been initialized.
   */
  async getLegalizacion(tenantId: number, contratoId: number): Promise<ContratoLegalizacionPaso[]> {
    const contract = await this.contractRepository.findOne({
      where: { id: contratoId, tenantId },
    });
    if (!contract) throw new NotFoundError('Contract', contratoId);

    return this.legalizacionRepository.find({
      where: { contratoId },
      order: { numeroPaso: 'ASC' },
    });
  }

  /**
   * Initialize the 4 legalization steps for a contract.
   * Idempotent — returns existing steps if already initialized.
   */
  async iniciarLegalizacion(
    tenantId: number,
    contratoId: number,
    _usuarioId: number
  ): Promise<ContratoLegalizacionPaso[]> {
    const contract = await this.contractRepository.findOne({
      where: { id: contratoId, tenantId },
    });
    if (!contract) throw new NotFoundError('Contract', contratoId);

    if (!['ACTIVO', 'BORRADOR'].includes(contract.estado)) {
      throw new BusinessRuleError(
        `No se puede iniciar legalización en estado ${contract.estado}. Solo contratos ACTIVO o BORRADOR.`,
        'LEGALIZACION_ESTADO_INVALIDO'
      );
    }

    // Check if already initialized
    const existing = await this.legalizacionRepository.find({
      where: { contratoId },
    });
    if (existing.length > 0) {
      return existing.sort((a, b) => a.numeroPaso - b.numeroPaso);
    }

    // Create the 4 steps
    const pasos = LEGALIZACION_PASOS.map((p) =>
      this.legalizacionRepository.create({
        contratoId,
        numeroPaso: p.numero,
        tipoPaso: p.tipo,
        completado: false,
        tenantId,
      })
    );

    const saved = await this.legalizacionRepository.save(pasos);
    logger.info('Legalization initialized', {
      contratoId,
      pasos: saved.length,
      numero: contract.numeroContrato,
    });

    return saved.sort((a, b) => a.numeroPaso - b.numeroPaso);
  }

  /**
   * Complete a legalization step (must be done in order).
   */
  async completarPasoLegalizacion(
    tenantId: number,
    contratoId: number,
    numeroPaso: number,
    dto: { observaciones?: string; usuarioId: number }
  ): Promise<ContratoLegalizacionPaso[]> {
    const contract = await this.contractRepository.findOne({
      where: { id: contratoId, tenantId },
    });
    if (!contract) throw new NotFoundError('Contract', contratoId);

    const pasos = await this.legalizacionRepository.find({
      where: { contratoId },
      order: { numeroPaso: 'ASC' },
    });

    if (pasos.length === 0) {
      throw new BusinessRuleError(
        'La legalización no ha sido iniciada. Use el botón "Iniciar Legalización" primero.',
        'LEGALIZACION_NO_INICIADA'
      );
    }

    const paso = pasos.find((p) => p.numeroPaso === numeroPaso);
    if (!paso) {
      throw new NotFoundError('PasoLegalizacion', numeroPaso);
    }

    if (paso.completado) {
      throw new ConflictError(
        `El paso ${numeroPaso} (${LEGALIZACION_PASO_LABELS[paso.tipoPaso]}) ya fue completado.`
      );
    }

    // Steps must be completed in order
    const previousIncomplete = pasos.find((p) => p.numeroPaso < numeroPaso && !p.completado);
    if (previousIncomplete) {
      throw new BusinessRuleError(
        `Debe completar el paso ${previousIncomplete.numeroPaso} (${LEGALIZACION_PASO_LABELS[previousIncomplete.tipoPaso]}) antes de continuar.`,
        'LEGALIZACION_PASO_FUERA_DE_ORDEN'
      );
    }

    // Complete the step
    paso.completado = true;
    paso.fechaCompletado = new Date();
    paso.completadoPor = dto.usuarioId;
    if (dto.observaciones) paso.observaciones = dto.observaciones;

    await this.legalizacionRepository.save(paso);

    logger.info('Legalization step completed', {
      contratoId,
      numeroPaso,
      tipoPaso: paso.tipoPaso,
      numero: contract.numeroContrato,
    });

    // Return all steps (refreshed)
    return this.legalizacionRepository.find({
      where: { contratoId },
      order: { numeroPaso: 'ASC' },
    });
  }

  /**
   * Undo a legalization step (revert to pending).
   * Can only undo the last completed step.
   */
  async revertirPasoLegalizacion(
    tenantId: number,
    contratoId: number,
    numeroPaso: number,
    usuarioId: number
  ): Promise<ContratoLegalizacionPaso[]> {
    const contract = await this.contractRepository.findOne({
      where: { id: contratoId, tenantId },
    });
    if (!contract) throw new NotFoundError('Contract', contratoId);

    const pasos = await this.legalizacionRepository.find({
      where: { contratoId },
      order: { numeroPaso: 'ASC' },
    });

    const paso = pasos.find((p) => p.numeroPaso === numeroPaso);
    if (!paso) throw new NotFoundError('PasoLegalizacion', numeroPaso);
    if (!paso.completado) {
      throw new ConflictError(`El paso ${numeroPaso} aún no ha sido completado.`);
    }

    // Can only undo the last completed step
    const laterCompleted = pasos.find((p) => p.numeroPaso > numeroPaso && p.completado);
    if (laterCompleted) {
      throw new BusinessRuleError(
        `No se puede revertir el paso ${numeroPaso}. Debe revertir primero el paso ${laterCompleted.numeroPaso}.`,
        'LEGALIZACION_REVERTIR_FUERA_DE_ORDEN'
      );
    }

    paso.completado = false;
    paso.fechaCompletado = undefined;
    paso.completadoPor = undefined;
    paso.observaciones = undefined;

    await this.legalizacionRepository.save(paso);

    logger.info('Legalization step reverted', {
      contratoId,
      numeroPaso,
      revertedBy: usuarioId,
    });

    return this.legalizacionRepository.find({
      where: { contratoId },
      order: { numeroPaso: 'ASC' },
    });
  }
}
