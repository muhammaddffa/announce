import { Router } from 'express';
import { DepartmentController } from './department.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();
const controller = new DepartmentController();

// Apply auth middleware
router.use(authMiddleware);

router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);
router.post('/', authMiddleware, controller.create);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.delete);

export default router;