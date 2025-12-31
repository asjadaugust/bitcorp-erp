import { Router } from 'express';
import Operator from '../models/Operator';
import DailyReport from '../models/DailyReport';
import { authenticate } from '../middleware/auth.middleware';
import { Op } from 'sequelize';

const router = Router();

// Get all operators
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, skill, search } = req.query;
    const where: any = {};
    
    if (status) where.status = status;
    if (skill) {
      where.skills = {
        [Op.contains]: [skill],
      };
    }
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { documentNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const operators = await Operator.findAll({
      where,
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    });

    res.json(operators);
  } catch (error) {
    console.error('Error fetching operators:', error);
    res.status(500).json({ message: 'Error fetching operators' });
  }
});

// Get operator by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const operator = await Operator.findByPk(req.params.id);
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }
    res.json(operator);
  } catch (error) {
    console.error('Error fetching operator:', error);
    res.status(500).json({ message: 'Error fetching operator' });
  }
});

// Create new operator
router.post('/', authenticate, async (req, res) => {
  try {
    const operator = await Operator.create(req.body);
    res.status(201).json(operator);
  } catch (error) {
    console.error('Error creating operator:', error);
    res.status(500).json({ message: 'Error creating operator' });
  }
});

// Update operator
router.put('/:id', authenticate, async (req, res) => {
  try {
    const operator = await Operator.findByPk(req.params.id);
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }
    await operator.update(req.body);
    res.json(operator);
  } catch (error) {
    console.error('Error updating operator:', error);
    res.status(500).json({ message: 'Error updating operator' });
  }
});

// Delete operator
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const operator = await Operator.findByPk(req.params.id);
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }
    await operator.destroy();
    res.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Error deleting operator:', error);
    res.status(500).json({ message: 'Error deleting operator' });
  }
});

// Add skill to operator
router.post('/:id/skills', authenticate, async (req, res) => {
  try {
    const { skill } = req.body;
    const operator = await Operator.findByPk(req.params.id);
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }
    
    if (!operator.skills.includes(skill)) {
      operator.skills.push(skill);
      await operator.save();
    }
    
    res.json(operator);
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({ message: 'Error adding skill' });
  }
});

// Remove skill from operator
router.delete('/:id/skills/:skill', authenticate, async (req, res) => {
  try {
    const operator = await Operator.findByPk(req.params.id);
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }
    
    operator.skills = operator.skills.filter(s => s !== req.params.skill);
    await operator.save();
    
    res.json(operator);
  } catch (error) {
    console.error('Error removing skill:', error);
    res.status(500).json({ message: 'Error removing skill' });
  }
});

// Get available operators (not assigned today)
router.get('/available/today', authenticate, async (req, res) => {
  try {
    const { skill, date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find operators already assigned on this date
    const assignedReports = await DailyReport.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay, endOfDay],
        },
      } as any,
      attributes: ['operatorId'],
    });

    const assignedOperatorIds = assignedReports.map(r => r.operatorId);

    const where: any = { 
      status: 'active',
      id: {
        [Op.notIn]: assignedOperatorIds.length > 0 ? assignedOperatorIds : [-1],
      },
    };
    
    if (skill) {
      where.skills = {
        [Op.contains]: [skill],
      };
    }

    const operators = await Operator.findAll({
      where,
      order: [['performanceRating', 'DESC'], ['totalHoursWorked', 'DESC']],
    });

    res.json(operators);
  } catch (error) {
    console.error('Error fetching available operators:', error);
    res.status(500).json({ message: 'Error fetching available operators' });
  }
});

// Get operator statistics
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const operatorId = parseInt(req.params.id);
    const operator = await Operator.findByPk(operatorId);
    
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }

    const reports = await DailyReport.findAll({
      where: { operatorId },
      order: [['date', 'DESC']],
      limit: 30,
    });

    const totalHours = reports.reduce((sum, r) => {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    const totalFuel = reports.reduce((sum, r) => sum + ((r as any).fuelUsed || (r as any).fuel_used || 0), 0);

    res.json({
      operator: {
        id: operator.id,
        name: operator.getFullName(),
        status: operator.status,
        skills: operator.skills,
        performanceRating: operator.performanceRating || 0,
      },
      stats: {
        totalReports: reports.length,
        totalHours: Math.round(totalHours * 100) / 100,
        avgHoursPerDay: reports.length > 0 ? Math.round((totalHours / reports.length) * 100) / 100 : 0,
        totalFuelUsed: Math.round(totalFuel * 100) / 100,
        projectsWorked: new Set(reports.map(r => r.projectId || 'unknown')).size,
        equipmentUsed: new Set(reports.map(r => r.equipmentId)).size,
      },
    });
  } catch (error) {
    console.error('Error fetching operator stats:', error);
    res.status(500).json({ message: 'Error fetching operator stats' });
  }
});

// Send notification to operators
router.post('/notify', authenticate, async (req, res) => {
  try {
    const { operatorIds, title, message, type, jobDetails } = req.body;
    
    if (!operatorIds || operatorIds.length === 0) {
      return res.status(400).json({ message: 'No operators specified' });
    }

    const operators = await Operator.findAll({
      where: {
        id: operatorIds,
        status: 'active',
      },
    });

    const results = [];
    for (const operator of operators) {
      // Log notification (in production, integrate with SMS/Email/Push services)
      console.log('Sending notification:', {
        to: operator.getFullName(),
        email: operator.email,
        phone: operator.phone,
        title,
        message,
        type,
        jobDetails,
      });

      results.push({
        operatorId: operator.id,
        operatorName: operator.getFullName(),
        status: 'sent',
        channels: [operator.email ? 'email' : null, operator.phone ? 'sms' : null].filter(Boolean),
      });
    }
    
    res.json({
      message: 'Notifications sent successfully',
      recipients: results.length,
      results,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ message: 'Error sending notifications' });
  }
});

export default router;
