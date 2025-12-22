import express from "express";
import {
  createDebt,
  getDebts,
  getCustomerDebts,
  payDebt,
  quickCreateCustomer,
} from "../controller/DebtController.js";

const router = express.Router();

router.post("/", createDebt);
router.get("/", getDebts);
router.get("/customer/:id", getCustomerDebts);
router.put("/pay/:id", payDebt);
router.post("/quick-create", quickCreateCustomer);


export default router;
