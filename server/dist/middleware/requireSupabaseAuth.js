import { createRemoteJWKSet, jwtVerify } from "jose";
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.SUPABASE_PROJECT_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL for JWT verification.");
}
const resolvedSupabaseUrl = supabaseUrl;
const jwksUrl = process.env.SUPABASE_JWKS_URL ??
    new URL("/auth/v1/.well-known/jwks.json", resolvedSupabaseUrl).toString();
const issuer = `${resolvedSupabaseUrl.replace(/\/$/, "")}/auth/v1`;
const jwks = createRemoteJWKSet(new URL(jwksUrl));
export async function requireSupabaseAuth(req, res, next) {
    try {
        const authorization = req.headers.authorization;
        if (!authorization?.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing Supabase access token." });
        }
        const token = authorization.slice("Bearer ".length);
        try {
            const { payload } = await jwtVerify(token, jwks, {
                issuer,
            });
            req.supabaseUser = payload;
            return next();
        }
        catch (jwtError) {
            if (!supabaseAnonKey) {
                throw jwtError;
            }
            const verifyResponse = await fetch(`${resolvedSupabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
                headers: {
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!verifyResponse.ok) {
                throw jwtError;
            }
            const user = (await verifyResponse.json());
            req.supabaseUser = user;
            return next();
        }
    }
    catch (error) {
        console.error("Supabase auth verification failed:", error);
        return res.status(401).json({ message: "Invalid or expired Supabase session." });
    }
}
