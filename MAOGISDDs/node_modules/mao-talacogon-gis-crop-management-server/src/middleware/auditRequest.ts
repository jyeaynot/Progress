import type { NextFunction, Request, Response } from "express";
import pool from "../db/pool";
import type { SupabaseAuthRequest } from "./requireSupabaseAuth";

export function auditRequest(action: string, entityType: string) {
  return async (req: SupabaseAuthRequest, _res: Response, next: NextFunction) => {
    try {
      await pool.query(
        `
          insert into audit_logs (
            actor_user_id,
            actor_email,
            action,
            entity_type,
            entity_id,
            metadata
          ) values ($1, $2, $3, $4, $5, $6)
        `,
        [
          req.supabaseUser?.sub ?? null,
          typeof req.supabaseUser?.email === "string" ? req.supabaseUser.email : null,
          action,
          entityType,
          typeof req.params?.id === "string" ? req.params.id : null,
          JSON.stringify({
            path: req.originalUrl,
            method: req.method,
          }),
        ]
      );
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }

    next();
  };
}
