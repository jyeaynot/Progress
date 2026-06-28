import { Router } from "express";
import { getCurrentUser, upsertCurrentUserProfile } from "../controllers/auth.controller";

const router = Router();

router.get("/me", getCurrentUser);
router.post("/me", upsertCurrentUserProfile);

export default router;
