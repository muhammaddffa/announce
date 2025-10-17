import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();
const controller = new AuthController();

// router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/verify', controller.verifyToken);

router.get('/me', authMiddleware, controller.getProfile);

export default router;