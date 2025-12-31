import { Router } from 'express';
import * as checklistController from './checklist.controller';

const router = Router();

// ============================================================================
// CHECKLIST TEMPLATES ROUTES
// ============================================================================

/**
 * @route   GET /api/checklists/templates
 * @desc    Get all checklist templates
 * @query   checklist_type, equipment_category_id, is_active, company_id
 * @access  Private
 */
router.get('/templates', checklistController.getAllTemplates);

/**
 * @route   GET /api/checklists/templates/:id
 * @desc    Get checklist template by ID
 * @access  Private
 */
router.get('/templates/:id', checklistController.getTemplateById);

/**
 * @route   POST /api/checklists/templates
 * @desc    Create new checklist template
 * @body    { checklist_type, template_name, items, equipment_category_id?, description?, is_active? }
 * @access  Private (Admin/Manager)
 */
router.post('/templates', checklistController.createTemplate);

/**
 * @route   PUT /api/checklists/templates/:id
 * @desc    Update checklist template
 * @body    Partial template data
 * @access  Private (Admin/Manager)
 */
router.put('/templates/:id', checklistController.updateTemplate);

/**
 * @route   DELETE /api/checklists/templates/:id
 * @desc    Delete checklist template
 * @access  Private (Admin)
 */
router.delete('/templates/:id', checklistController.deleteTemplate);

// ============================================================================
// EQUIPMENT CHECKLISTS ROUTES
// ============================================================================

/**
 * @route   GET /api/checklists
 * @desc    Get all equipment checklists
 * @query   equipment_id, operator_id, daily_report_id, checklist_type, overall_status, 
 *          start_date, end_date, company_id, page, limit
 * @access  Private
 */
router.get('/', checklistController.getAllChecklists);

/**
 * @route   GET /api/checklists/:id
 * @desc    Get checklist by ID
 * @access  Private
 */
router.get('/:id', checklistController.getChecklistById);

/**
 * @route   POST /api/checklists
 * @desc    Create new equipment checklist
 * @body    { equipment_id, checklist_type, items, template_id?, operator_id?, 
 *            daily_report_id?, observations?, photos?, signed_by?, signature_url? }
 * @access  Private
 */
router.post('/', checklistController.createChecklist);

/**
 * @route   PUT /api/checklists/:id
 * @desc    Update equipment checklist
 * @body    Partial checklist data
 * @access  Private
 */
router.put('/:id', checklistController.updateChecklist);

/**
 * @route   DELETE /api/checklists/:id
 * @desc    Delete equipment checklist
 * @access  Private (Admin/Manager)
 */
router.delete('/:id', checklistController.deleteChecklist);

// ============================================================================
// ANALYTICS & REPORTS ROUTES
// ============================================================================

/**
 * @route   GET /api/checklists/analytics/summary
 * @desc    Get checklist summary statistics
 * @query   company_id, start_date, end_date
 * @access  Private
 */
router.get('/analytics/summary', checklistController.getChecklistSummary);

/**
 * @route   GET /api/checklists/equipment/:equipmentId/history
 * @desc    Get checklist history for specific equipment
 * @query   limit (default: 10)
 * @access  Private
 */
router.get('/equipment/:equipmentId/history', checklistController.getEquipmentChecklistHistory);

export default router;
