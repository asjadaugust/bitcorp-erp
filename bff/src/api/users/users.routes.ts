/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { ROLES } from '../../types/roles';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from '../../types/dto/user.dto';

const router = Router();
const usersController = new UsersController();

// All routes require authentication
router.use(authenticate);

// Lightweight search — open to all authenticated users (before ADMIN guard)
router.get('/search', usersController.search);

// All remaining routes require ADMIN role
router.use(authorize(ROLES.ADMIN));

// Static routes before parameterized routes
router.get('/roles', usersController.getRoles);

// CRUD routes
router.get('/', usersController.findAll);
router.post('/', validateDto(CreateUserDto), usersController.create);
router.get('/:id', usersController.findById);
router.put('/:id', validateDto(UpdateUserDto), usersController.update);
router.patch('/:id/password', validateDto(ChangePasswordDto), usersController.changePassword);
router.patch('/:id/toggle-active', usersController.toggleActive);

export default router;
