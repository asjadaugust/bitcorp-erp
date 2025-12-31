import { Router } from 'express';
import employeeRoutes from './employee.routes';
import documentRoutes from './operator-document.routes';
import availabilityRoutes from './operator-availability.routes';

const router = Router();

// Mount sub-routes
// Note: /employees endpoint uses operators table (for backward compatibility)
// Prefer using /api/operators for new implementations
router.use('/employees', employeeRoutes);
router.use('/documents', documentRoutes);
router.use('/availability', availabilityRoutes);

export default router;
