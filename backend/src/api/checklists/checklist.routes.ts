/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ChecklistController } from './checklist.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new ChecklistController();

// Apply authentication to all routes
router.use(authenticate);

// ============================================================================
// TEMPLATE ROUTES
// ============================================================================

/**
 * @route   GET /api/checklists/templates
 * @desc    Get all checklist templates
 * @query   activo, tipoEquipo, search
 * @access  Private
 */
router.get('/templates', controller.getAllTemplates);

/**
 * @route   GET /api/checklists/templates/:id
 * @desc    Get template by ID with items
 * @access  Private
 */
router.get('/templates/:id', controller.getTemplateById);

/**
 * @route   POST /api/checklists/templates
 * @desc    Create new checklist template
 * @body    { codigo, nombre, tipoEquipo?, descripcion?, frecuencia?, activo? }
 * @access  Private (Admin/Manager)
 */
router.post('/templates', controller.createTemplate);

/**
 * @route   PUT /api/checklists/templates/:id
 * @desc    Update template
 * @access  Private (Admin/Manager)
 */
router.put('/templates/:id', controller.updateTemplate);

/**
 * @route   DELETE /api/checklists/templates/:id
 * @desc    Delete template
 * @access  Private (Admin)
 */
router.delete('/templates/:id', controller.deleteTemplate);

// ============================================================================
// ITEM ROUTES
// ============================================================================

/**
 * @route   POST /api/checklists/items
 * @desc    Create new checklist item
 * @body    { plantillaId, orden, categoria, descripcion, tipoVerificacion, etc. }
 * @access  Private (Admin/Manager)
 */
router.post('/items', controller.createItem);

/**
 * @route   PUT /api/checklists/items/:id
 * @desc    Update checklist item
 * @access  Private (Admin/Manager)
 */
router.put('/items/:id', controller.updateItem);

/**
 * @route   DELETE /api/checklists/items/:id
 * @desc    Delete checklist item
 * @access  Private (Admin)
 */
router.delete('/items/:id', controller.deleteItem);

// ============================================================================
// INSPECTION ROUTES
// ============================================================================

/**
 * @route   GET /api/checklists/inspections/stats
 * @desc    Get inspection statistics
 * @query   startDate, endDate
 * @access  Private
 */
router.get('/inspections/stats', controller.getInspectionStats);

/**
 * @route   GET /api/checklists/inspections
 * @desc    Get all inspections (paginated)
 * @query   page, limit, equipoId, trabajadorId, estado, resultadoGeneral, startDate, endDate
 * @access  Private
 */
router.get('/inspections', controller.getAllInspections);

/**
 * @route   GET /api/checklists/inspections/:id
 * @desc    Get inspection by ID
 * @access  Private
 */
router.get('/inspections/:id', controller.getInspectionById);

/**
 * @route   GET /api/checklists/inspections/:id/with-results
 * @desc    Get inspection with all results
 * @access  Private
 */
router.get('/inspections/:id/with-results', controller.getInspectionWithResults);

/**
 * @route   POST /api/checklists/inspections
 * @desc    Create new inspection
 * @body    { plantillaId, equipoId, trabajadorId, fechaInspeccion?, etc. }
 * @access  Private
 */
router.post('/inspections', controller.createInspection);

/**
 * @route   PUT /api/checklists/inspections/:id
 * @desc    Update inspection
 * @access  Private
 */
router.put('/inspections/:id', controller.updateInspection);

/**
 * @route   POST /api/checklists/inspections/:id/complete
 * @desc    Complete inspection (auto-calculate statistics)
 * @access  Private
 */
router.post('/inspections/:id/complete', controller.completeInspection);

/**
 * @route   POST /api/checklists/inspections/:id/cancel
 * @desc    Cancel inspection
 * @access  Private
 */
router.post('/inspections/:id/cancel', controller.cancelInspection);

// ============================================================================
// RESULT ROUTES
// ============================================================================

/**
 * @route   GET /api/checklists/inspections/:inspectionId/results
 * @desc    Get all results for an inspection
 * @access  Private
 */
router.get('/inspections/:inspectionId/results', controller.getResultsByInspection);

/**
 * @route   POST /api/checklists/results
 * @desc    Save checklist result (create or update)
 * @body    { inspeccionId, itemId, conforme?, valorMedido?, observaciones?, accionRequerida?, fotoUrl? }
 * @access  Private
 */
router.post('/results', controller.saveResult);

export default router;
