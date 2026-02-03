import express from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
} from '../controller/customerController.js';
import { authenticate, authorizeRoles } from '../middleware/authmiddleware.js';

const router = express.Router();

router.get('/', authenticate,  getCustomers)

router.post("/", authenticate ,createCustomer);

router.get("/", authenticate , searchCustomers);

router.get('/:id',authenticate, getCustomer)
router.put("/:id", authenticate, updateCustomer)
  router.delete("/:id", authenticate , authorizeRoles("admin") ,deleteCustomer);

export default router;