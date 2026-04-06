import authMiddleware from "@/middlewares/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const middlewares = [authMiddleware];

export async function middleware(request: NextRequest) {
	for (const mw of middlewares) {
		const response = await mw(request);
		if (response && response !== NextResponse.next()) {
			return response;
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/settings/:path*", "/chat/:path*", "/api/:path*"],
};
