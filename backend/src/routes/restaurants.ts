import { Router, Request, Response } from 'express';
import { RestaurantService } from '../services/restaurantService';

const router = Router();

// GET /api/v1/restaurants
router.get('/', async (req: Request, res: Response) => {
  try {
    const { city, cuisine, search, veg_only } = req.query;
    const restaurants = await RestaurantService.listRestaurants({
      city: city as string | undefined,
      cuisine: cuisine as string | undefined,
      search: search as string | undefined,
      vegOnly: veg_only === 'true'
    });
    res.json(restaurants);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load restaurants', message: error.message });
  }
});

// GET /api/v1/restaurants/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid restaurant id' });
      return;
    }
    const restaurant = await RestaurantService.getRestaurantById(id);
    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }
    res.json(restaurant);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get restaurant', message: error.message });
  }
});

// GET /api/v1/restaurants/:id/menu
router.get('/:id/menu', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid restaurant id' });
      return;
    }
    const menu = await RestaurantService.getRestaurantMenu(id);
    res.json(menu);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load menu', message: error.message });
  }
});

export default router;
