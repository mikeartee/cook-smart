import express, {Request, Response} from 'express';
import {AdminRecipesController} from '../controllers/AdminRecipesController';
import {requireAdmin} from '../middleware/adminAuth';

const router = express.Router();
const controller = new AdminRecipesController();

// All routes require admin authentication
router.use(requireAdmin);

// Recipe list with pagination, search, and filters
router.get('/', async (req: Request, res: Response) => {
  await controller.listRecipes(req, res);
});

// Get recipe details
router.get('/:id', async (req: Request, res: Response) => {
  await controller.getRecipeDetails(req, res);
});

// Update recipe status (approve/reject)
router.patch('/:id/status', async (req: Request, res: Response) => {
  await controller.updateRecipeStatus(req, res);
});

// Bulk update recipes
router.patch('/bulk/update', async (req: Request, res: Response) => {
  await controller.bulkUpdateRecipes(req, res);
});

// Bulk delete recipes
router.delete('/bulk/delete', async (req: Request, res: Response) => {
  await controller.bulkDeleteRecipes(req, res);
});

// Delete single recipe
router.delete('/:id', async (req: Request, res: Response) => {
  await controller.deleteRecipe(req, res);
});

export default router;
