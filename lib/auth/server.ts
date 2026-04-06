import { createNeonAuth } from "@neondatabase/auth/next/server";

const getAuth = () =>
	createNeonAuth({
		baseUrl: process.env.NEON_AUTH_BASE_URL ?? "",
		cookies: {
			secret: process.env.NEON_AUTH_COOKIE_SECRET ?? "",
		},
	});

export const auth = new Proxy({} as ReturnType<typeof getAuth>, {
	get(_target, prop: string | symbol) {
		return Reflect.get(getAuth(), prop);
	},
});
