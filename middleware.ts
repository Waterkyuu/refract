import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/settings", "/chat"];

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
	if (!isProtected) return NextResponse.next();

	const { data: session } = await auth.getSession();
	if (!session?.user) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/settings/:path*", "/chat/:path*"],
};
