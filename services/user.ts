import jotaiStore, { logoutAtom, userAtom } from "@/atoms";
import { client } from "@/lib/auth";
import { handleError } from "@/lib/error-handler";
import type { User } from "@/types";

type provider = "google" | "github" | "vercel";

const getUserInfo = async () => {
	const { data, error } = await client.auth.getSession();
	if (error) {
		handleError(error, "Failed to get user info");
	}

	if (data?.session) {
		localStorage.setItem("token", data?.session.token);
	}

	if (data?.user) {
		const { id, name, email, image, createdAt, updatedAt, banned } = data.user;

		const user: User = {
			id: id,
			userName: name,
			email: email,
			avatar: image || null,
			createdAt: createdAt.toISOString(),
			updatedAt: updatedAt.toISOString(),
			banned: banned,
		};

		jotaiStore.set(userAtom, user);
	} else {
		console.error("No active session");
	}
};

const sendSignInOtp = async (email: string) => {
	const { error } = await client.auth.emailOtp.sendVerificationOtp({
		email: email,
		type: "sign-in",
	});
	if (error) {
		handleError(error);
	}
};

const signInWithOtp = async (email: string, otpCode: string) => {
	const { data, error } = await client.auth.signIn.emailOtp({
		email: email,
		otp: otpCode,
	});

	if (error) {
		handleError(error, "Login faild");
	}

	console.log("Successfully login:", data);
};

const handleOauthSignIn = async (provider: provider) => {
	const callbackURL = process.env.DEV ? "http://localhost:3000" : "";

	try {
		await client.auth.signIn.social({
			provider: provider,
			callbackURL: callbackURL || window.location.origin,
		});
	} catch (error) {
		handleError(error);
	}
};

const signInGoogle = async () => {
	await handleOauthSignIn("google");
};

const signInGithub = async () => {
	await handleOauthSignIn("github");
};

const signInVercel = async () => {
	await handleOauthSignIn("vercel");
};

const signOut = async () => {
	try {
		await client.auth.signOut();
		jotaiStore.set(logoutAtom);
		localStorage.removeItem("token");
	} catch (error) {
		handleError(error);
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
