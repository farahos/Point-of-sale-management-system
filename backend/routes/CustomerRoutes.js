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
import validate from '../middleware/validate.js';

const router = express.Router();

router.get('/', authenticate, validate,  getCustomers)

router.post("/", authenticate ,  validate,createCustomer);

router.get("/", authenticate , validate, searchCustomers);

router.get('/:id',authenticate, getCustomer)
router.put("/:id", authenticate, updateCustomer)
  router.delete("/:id", authenticate , authorizeRoles("admin") ,deleteCustomer);

export default router;