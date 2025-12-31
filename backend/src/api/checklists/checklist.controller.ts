import { Request, Response } from 'express';
import checklistService from '../../services/checklist.service';
import { ChecklistType } from '../../models/checklist-template.model';
import { ChecklistStatus } from '../../models/equipment-checklist.model';

// ============================================================================
// CHECKLIST TEMPLATES
// ============================================================================

export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const filters: any = {};
    
    if (req.query.checklist_type) {
      filters.checklist_type = req.query.checklist_type as ChecklistType;
    }
    if (req.query.equipment_category_id) {
      filters.equipment_category_id = req.query.equipment_category_id as string;
    }
    if (req.query.is_active !== undefined) {
      filters.is_active = req.query.is_active === 'true';
    }
    if (req.query.company_id || (req as any).user?.company_id) {
      filters.company_id = (req.query.company_id as string) || (req as any).user?.company_id;
    }

    const templates = await checklistService.getAllTemplates(filters);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await checklistService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ 
      error: 'Failed to fetch template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const dto = {
      ...req.body,
      company_id: req.body.company_id || (req as any).user?.company_id,
      created_by: (req as any).user?.id,
    };

    // Validate required fields
    if (!dto.checklist_type) {
      return res.status(400).json({ error: 'checklist_type is required' });
    }
    if (!dto.template_name) {
      return res.status(400).json({ error: 'template_name is required' });
    }
    if (!dto.items || !Array.isArray(dto.items)) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const template = await checklistService.createTemplate(dto);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ 
      error: 'Failed to create template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await checklistService.updateTemplate(id, req.body);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ 
      error: 'Failed to update template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await checklistService.deleteTemplate(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ 
      error: 'Failed to delete template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// EQUIPMENT CHECKLISTS
// ============================================================================

export const getAllChecklists = async (req: Request, res: Response) => {
  try {
    const filters = {
      equipment_id: req.query.equipment_id as string,
      operator_id: req.query.operator_id as string,
      daily_report_id: req.query.daily_report_id as string,
      checklist_type: req.query.checklist_type as ChecklistType,
      overall_status: req.query.overall_status as ChecklistStatus,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      company_id: req.query.company_id as string || (req as any).user?.company_id,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const checklists = await checklistService.getAllChecklists(filters);
    res.json(checklists);
  } catch (error) {
    console.error('Error fetching checklists:', error);
    res.status(500).json({ 
      error: 'Failed to fetch checklists',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getChecklistById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const checklist = await checklistService.getChecklistById(id);

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    res.json(checklist);
  } catch (error) {
    console.error('Error fetching checklist:', error);
    res.status(500).json({ 
      error: 'Failed to fetch checklist',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createChecklist = async (req: Request, res: Response) => {
  try {
    const dto = {
      ...req.body,
      company_id: req.body.company_id || (req as any).user?.company_id,
    };

    // Validate required fields
    if (!dto.equipment_id) {
      return res.status(400).json({ error: 'equipment_id is required' });
    }
    if (!dto.checklist_type) {
      return res.status(400).json({ error: 'checklist_type is required' });
    }
    if (!dto.items || !Array.isArray(dto.items)) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const checklist = await checklistService.createChecklist(dto);
    res.status(201).json(checklist);
  } catch (error) {
    console.error('Error creating checklist:', error);
    res.status(500).json({ 
      error: 'Failed to create checklist',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateChecklist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const checklist = await checklistService.updateChecklist(id, req.body);

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    res.json(checklist);
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({ 
      error: 'Failed to update checklist',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteChecklist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await checklistService.deleteChecklist(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting checklist:', error);
    res.status(500).json({ 
      error: 'Failed to delete checklist',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// ANALYTICS & REPORTS
// ============================================================================

export const getChecklistSummary = async (req: Request, res: Response) => {
  try {
    const filters = {
      company_id: req.query.company_id as string || (req as any).user?.company_id,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    };

    const summary = await checklistService.getChecklistSummary(filters);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getEquipmentChecklistHistory = async (req: Request, res: Response) => {
  try {
    const { equipmentId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const history = await checklistService.getEquipmentChecklistHistory(equipmentId, limit);
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
