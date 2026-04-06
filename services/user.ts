import jotaiStore, { logoutAtom } from "@/atoms";
import { authClient } from "@/lib/auth/client";

type Provider = "google" | "github" | "vercel";

const sendSignInOtp = async (email: string) => {
	const { error } = await authClient.emailOtp.sendVerificationOtp({
		email,
		type: "sign-in",
	});
	if (error) throw error;
};

const signInWithOtp = async (email: string, otpCode: string) => {
	const { error } = await authClient.signIn.emailOtp({
		email,
		otp: otpCode,
	});
	if (error) throw error;
};

const handleOAuthSignIn = async (provider: Provider) => {
	await authClient.signIn.social({
		provider,
		callbackURL: window.location.origin,
	});
};

const signInGoogle = async () => {
	await handleOAuthSignIn("google");
};

const signInGithub = async () => {
	await handleOAuthSignIn("github");
};

const signInVercel = async () => {
	await handleOAuthSignIn("vercel");
};

const signOut = async () => {
	await authClient.signOut();
	jotaiStore.set(logoutAtom);
};

export {
	signOut,
	signInGithub,
	sendSignInOtp,
	signInWithOtp,
	signInVercel,
	signInGoogle,
};
