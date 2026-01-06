/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from './employee.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Explicitly handle /employees to avoid it being captured by /:dni
router.get('/employees', getEmployees);
router.get('/', getEmployees);
router.get('/:dni', getEmployee);
router.post('/', createEmployee);
router.put('/:dni', updateEmployee);
router.delete('/:dni', deleteEmployee);

export default router;
