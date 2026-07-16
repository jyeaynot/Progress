import { Router } from "express";
import { filterFarms, getFarmById, listFarms, searchFarms } from "../controllers/farms.controller";

const router = Router();

router.get("/search", searchFarms);
router.get("/filter", filterFarms);
router.get("/", listFarms);
router.get("/:id", getFarmById);

export default router;
