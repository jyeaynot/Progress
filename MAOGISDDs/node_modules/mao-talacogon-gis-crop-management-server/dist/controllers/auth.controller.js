import pool from "../db/pool.js";
export async function getCurrentUser(req, res) {
    try {
        const userId = req.supabaseUser?.sub;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized." });
        }
        const result = await pool.query(`
        select
          sp.id,
          sp.full_name as "fullName",
          sp.role,
          sp.office,
          sp.is_active as "isActive",
          sp.created_at as "createdAt",
          sp.updated_at as "updatedAt"
        from staff_profiles sp
        where sp.id = $1
        limit 1
      `, [userId]);
        return res.json({
            data: {
                user: {
                    id: userId,
                    email: typeof req.supabaseUser?.email === "string" ? req.supabaseUser.email : null,
                },
                profile: result.rows[0] ?? null,
            },
        });
    }
    catch (error) {
        console.error("Failed to load current user:", error);
        return res.status(500).json({ message: "Failed to load current user." });
    }
}
export async function upsertCurrentUserProfile(req, res) {
    try {
        const userId = req.supabaseUser?.sub;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized." });
        }
        const fullName = typeof req.body?.fullName === "string" ? req.body.fullName.trim() : "";
        const role = typeof req.body?.role === "string" ? req.body.role.trim() : "Staff";
        const office = typeof req.body?.office === "string" ? req.body.office.trim() : "MAO Talacogon";
        if (!fullName) {
            return res.status(400).json({ message: "fullName is required." });
        }
        const result = await pool.query(`
        insert into staff_profiles (id, full_name, role, office, updated_at)
        values ($1, $2, $3, $4, now())
        on conflict (id)
        do update set
          full_name = excluded.full_name,
          role = excluded.role,
          office = excluded.office,
          updated_at = now()
        returning
          id,
          full_name as "fullName",
          role,
          office,
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `, [userId, fullName, role, office]);
        return res.status(200).json({
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error("Failed to save current user profile:", error);
        return res.status(500).json({ message: "Failed to save current user profile." });
    }
}
