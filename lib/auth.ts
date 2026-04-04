import { createClient } from "@neondatabase/neon-js";

// Docs: https://neon.com/docs/reference/javascript-sdk
// Auth & database query
export const client = createClient({
	auth: {
		// It must start with PUBLIC_
		url: process.env.PUBLIC_NEON_AUTH_URL,
	},
	dataApi: {
		url: process.env.NEON_DATA_PUBLIC_API_URL,
	},
});
