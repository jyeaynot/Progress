import { Router } from "express";
import { exportFarmers, getFarmerById, getFarmers, createFarmer, updateFarmer, deleteFarmer, createInputAllocation, } from "../controllers/farmers.controller.js";
import { auditRequest } from "../middleware/auditRequest.js";
const router = Router();
router.get("/export", exportFarmers);
router.get("/", getFarmers);
router.get("/:id", getFarmerById);
// CRUD
router.post("/", auditRequest("create", "farmer"), createFarmer);
router.put("/:id", auditRequest("update", "farmer"), updateFarmer);
router.delete("/:id", auditRequest("delete", "farmer"), deleteFarmer);
// Allocations
router.post("/:id/allocations", auditRequest("create", "input_allocation"), createInputAllocation);
export default router;
