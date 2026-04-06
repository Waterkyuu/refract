import { createNeonAuth } from "@neondatabase/auth/next/server";

const neonAuthUrl = process.env.NEON_AUTH_URL ?? "";
const neonDataApiUrl = process.env.NEON_AUTH_COOKIE_SECRET ?? "";

export const auth = createNeonAuth({
	baseUrl: neonAuthUrl,
	cookies: {
		secret: neonDataApiUrl,
	},
});
