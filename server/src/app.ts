import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import farmersRoutes from "./routes/farmers.routes";
import { requireSupabaseAuth } from "./middleware/requireSupabaseAuth";
import { auditRequest } from "./middleware/auditRequest";

const app = express();

app.use(cors({
  origin: [
    'https://progress-frontend-nuwq.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use("/api/v1/auth", requireSupabaseAuth, authRoutes);
app.use("/api/v1/farmers", requireSupabaseAuth, auditRequest("access", "farmers"), farmersRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

export default app;
