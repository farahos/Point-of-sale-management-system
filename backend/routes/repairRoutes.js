// routes/repairRoutes.js
import express from 'express';
import {
  getRepairs,
  getRepairById,
  createRepair,
  updateRepair,
  deleteRepair,
  bulkDeleteRepairs,
  updateRepairStatus,
  getRepairStats,
  searchRepairs
} from '../controller/repairController.js';

const router = express.Router();

router.route('/')
  .get(getRepairs)
  .post(createRepair)
  .delete(bulkDeleteRepairs);

router.route('/search')
  .get(searchRepairs);

router.route('/stats/summary')
  .get(getRepairStats);

router.route('/:id')
  .get(getRepairById)
  .put(updateRepair)
  .delete(deleteRepair);

router.route('/:id/status')
  .patch(updateRepairStatus);

export default router;