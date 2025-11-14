import { Router } from 'express';
import { AnnouncementController } from './announcement.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();
const controller = new AnnouncementController();

router.get('/published', controller.getPublished);
router.get('/stats', controller.getStats);

// Private routes
router.get('/my-announcements', authMiddleware, controller.getMyAnnouncements);
router.post('/', authMiddleware, controller.create);
router.put('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.delete);
router.patch('/:id/publish', authMiddleware, controller.publish);
router.patch('/:id/unpublish', authMiddleware, controller.unpublish);

// Public routes
router.get('/', controller.getAll);
router.get('/tags', controller.getAllTags);
router.get('/:id', controller.getById);

// Comment routes
router.post('/:id/comments', authMiddleware, controller.addComment);
router.get('/:id/comments', authMiddleware, controller.getComments);
router.get('/comments/:commentId/replies', authMiddleware,controller.getReplies);
router.put('/comments/:commentId', authMiddleware, controller.updateComment);
router.delete('/comments/:commentId', authMiddleware, controller.deleteComment);

// Tag routes
router.get('/tags/search', authMiddleware, controller.searchTags);
router.get('/tags/popular', authMiddleware, controller.getPopularTags);

export default router;