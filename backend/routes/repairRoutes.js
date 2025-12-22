import express from "express";
const router = express.Router();
import {
  getRepairs,
  getRepairById,
    createRepair,
    updateRepair,
    deleteRepair,
    getRepairStats,
    searchRepairs
} from "../controller/repairController.js";

// GET all repairs
router.get("/", getRepairs);

// GET repair stats
router.get("/stats/summary", getRepairStats);

// GET search repairs
router.get("/search/:query", searchRepairs);

// GET single repair
router.get("/:id", getRepairById);

// POST create new repair
router.post("/", createRepair);

// PUT update repair
router.put("/:id", updateRepair);

// DELETE repair
router.delete("/:id", deleteRepair);

export default router;