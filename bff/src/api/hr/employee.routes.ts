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
import { validateDto } from '../../middleware/validation.middleware';
import { EmployeeCreateDto, EmployeeUpdateDto } from '../../types/dto/employee.dto';

const router = Router();

router.use(authenticate);

// Explicitly handle /employees to avoid it being captured by /:dni
router.get('/employees', getEmployees);
router.get('/', getEmployees);
router.get('/:dni', getEmployee);
router.post('/', validateDto(EmployeeCreateDto), createEmployee);
router.put('/:dni', validateDto(EmployeeUpdateDto), updateEmployee);
router.delete('/:dni', deleteEmployee);

export default router;
