import jotaiStore, { logoutAtom, userAtom } from "@/atoms";
import { client } from "@/lib/auth";
import { handleError } from "@/lib/error-handler";
import type { User } from "@/types";
import type { Provider } from "@supabase/supabase-js";

/**
 * Get current user info from Supabase session
 */
const getUserInfo = async () => {
	const {
		data: { session },
		error: sessionError,
	} = await client.auth.getSession();

	if (sessionError) {
		handleError(sessionError, "Failed to get session");
		return;
	}

	if (session?.access_token) {
		localStorage.setItem("token", session.access_token);
	}

	const {
		data: { user: supabaseUser },
		error: userError,
	} = await client.auth.getUser();

	if (userError) {
		handleError(userError, "Failed to get user info");
		return;
	}

	if (supabaseUser) {
		const { id, email, user_metadata, created_at, app_metadata } = supabaseUser;

		const user: User = {
			id,
			userName: user_metadata?.name || user_metadata?.full_name || "",
			email: email || "",
			avatar: user_metadata?.avatar_url || user_metadata?.picture || null,
			createdAt: created_at,
			updatedAt: user_metadata?.updated_at || created_at,
			banned: app_metadata?.banned ?? null,
		};

		jotaiStore.set(userAtom, user);
	} else {
		console.error("No active session");
	}
};

/**
 * Send sign-in OTP (magic link) to user's email
 */
const sendSignInOtp = async (email: string) => {
	const { error } = await client.auth.signInWithOtp({
		email,
		options: {
			// Should be set in Supabase dashboard redirect URLs, but can be added here as fallback
			emailRedirectTo: undefined,
		},
	});

	if (error) {
		handleError(error, "Failed to send OTP");
		throw error;
	}
};

/**
 * Verify OTP code and sign in
 */
const signInWithOtp = async (email: string, otpCode: string) => {
	const { data, error } = await client.auth.verifyOtp({
		email,
		token: otpCode,
		type: "email",
	});

	if (error) {
		handleError(error, "Login failed");
		throw error;
	}

	if (data.user) {
		// Trigger user info update after successful login
		await getUserInfo();
	}

	console.log("Successfully logged in:", data);
	return data;
};

/**
 * Handle OAuth sign-in with specified provider
 */
const handleOauthSignIn = async (provider: Provider) => {
	const baseUrl =
		process.env.NEXT_PUBLIC_VERCEL_URL ||
		process.env.NEXT_PUBLIC_BASE_URL ||
		(process.env.DEV ? "http://localhost:3000" : "");

	const { error } = await client.auth.signInWithOAuth({
		provider,
		options: {
			redirectTo: `${baseUrl}/auth/callback`,
			scopes: "email profile",
		},
	});

	if (error) {
		handleError(error, `Failed to sign in with ${provider}`);
		throw error;
	}
};

/**
 * Sign in with Google
 */
const signInGoogle = async () => {
	await handleOauthSignIn("google" as Provider);
};

/**
 * Sign in with GitHub
 */
const signInGithub = async () => {
	await handleOauthSignIn("github" as Provider);
};

/**
 * Sign in with Vercel
 */
const signInVercel = async () => {
	await handleOauthSignIn("vercel" as Provider);
};

/**
 * Sign out current user
 */
const signOut = async () => {
	try {
		const { error } = await client.auth.signOut();

		if (error) {
			handleError(error, "Failed to sign out");
			throw error;
		}

		jotaiStore.set(logoutAtom);
		localStorage.removeItem("token");
	} catch (error) {
		handleError(error, "Sign out failed");
		throw error;
	}
};

export {
	getUserInfo,
	signOut,
	signInGithub,
	sendSignInOtp,
	signInWithOtp,
	signInVercel,
	signInGoogle,
};
