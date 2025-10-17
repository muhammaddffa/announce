import { Router } from 'express';
import { EmployeeController } from './employee.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();
const controller = new EmployeeController();

// router.use(authMiddleware);

router.get('/', authMiddleware, controller.getAll);


router.get('/:id', controller.getById);

router.get('/department/:departmentId', controller.getByDepartment);

router.post('/', controller.create);

router.put('/:id', controller.update);

router.delete('/:id', controller.delete);

export default router;