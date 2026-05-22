import express from "express";
import authRoutes from "./routes/auth.routes.js";
import farmersRoutes from "./routes/farmers.routes.js";
import { requireSupabaseAuth } from "./middleware/requireSupabaseAuth.js";
import { auditRequest } from "./middleware/auditRequest.js";

const app = express();

app.use(express.json());
app.use("/api/v1/auth", requireSupabaseAuth, authRoutes);
app.use("/api/v1/farmers", requireSupabaseAuth, auditRequest("access", "farmers"), farmersRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

export default app;
