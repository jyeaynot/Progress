import pool from "../db/pool.js";
export function auditRequest(action, entityType) {
    return async (req, _res, next) => {
        try {
            await pool.query(`
          insert into audit_logs (
            actor_user_id,
            actor_email,
            action,
            entity_type,
            entity_id,
            metadata
          ) values ($1, $2, $3, $4, $5, $6)
        `, [
                req.supabaseUser?.sub ?? null,
                typeof req.supabaseUser?.email === "string" ? req.supabaseUser.email : null,
                action,
                entityType,
                typeof req.params?.id === "string" ? req.params.id : null,
                JSON.stringify({
                    path: req.originalUrl,
                    method: req.method,
                }),
            ]);
        }
        catch (error) {
            console.error("Failed to write audit log:", error);
        }
        next();
    };
}
