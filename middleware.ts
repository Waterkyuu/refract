import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(_request: NextRequest) {
	return NextResponse.next();
}

export const config = {
	matcher: [
		"/settings/:path*",
		"/mycreations/:path*",
		"/myfavourite/:path*",
		"/morecredits/:path*",
	],
};
