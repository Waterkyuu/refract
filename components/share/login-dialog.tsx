"use client";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { getZodErrorMsg, handleError } from "@/lib/error-handler";
import { cn } from "@/lib/utils";
import { sendSignInOtp, signInWithOtp } from "@/services/user";
import { LoginInputSchema } from "@/types";
import { AlertCircleIcon, ArrowLeft, ArrowRightIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import OauthGroup from "./oauth-group";

// OR separator
const OrSeparator = () => {
	return (
		<div className="flex w-full items-center justify-between">
			<div className="h-0 w-1/4 border border-gray-300" />
			<span className="text-gray-600 text-xs sm:text-sm">OR continue with</span>
			<div className="h-0 w-1/4 border border-gray-300" />
		</div>
	);
};

const LoginDialog = ({
	open,
	onOpenChange,
}: {
	/** Controlled open state */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
}) => {
	const [isLoading, setIsLoading] = useState(false); // Whether loading
	const [error, setError] = useState<string | string[]>(""); // Error message

	const [email, setEmail] = useState("");

	const [isSwitchEmail, setIsSwitchEmail] = useState(true); // Whether to use email for verification
	const [isOTP, setIsOTP] = useState(false); // Whether entering verification code

	const [otp, setOtp] = useState("");

	const handleEmailLogin = async () => {
		if (!email) {
			setError("Email cannot be empty");
			return;
		}

		setIsLoading(true);

		try {
			// Validate form
			// safeParse does not throw exception, returns { success, data?, error? }
			const result = LoginInputSchema.safeParse({
				email,
			});

			if (result.success) {
				await sendSignInOtp(email);

				toast.success("Verification code has been sent to" + email);

				setIsOTP(true);
			} else {
				console.error("Checkc failed", result.error);
				const errorMsg = getZodErrorMsg(result.error);
				setError(errorMsg);
			}
		} catch (error) {
			if (error instanceof Error) {
				console.error(error);
				setError(error?.message);
			} else {
				console.error(error);
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Auto verify OTP when 6 digits are entered
	useEffect(() => {
		const verifyOtp = async () => {
			if (otp.length === 6) {
				setIsLoading(true);
				try {
					await signInWithOtp(email, otp);
					toast.success("Login successful");

					// Reload the page after successful login
					window.location.reload();
				} catch (error) {
					setError(handleError(error));
				} finally {
					setIsLoading(false);
				}
			}
		};

		verifyOtp();
	}, [otp, email]);

	const resetDialogState = () => {
		setEmail("");
		setError("");
		setIsOTP(false);
		setIsSwitchEmail(true);
	};

	return (
		<Dialog
			// Add close callback function
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					resetDialogState();
				}
				onOpenChange?.(isOpen);
			}}
		>
			<DialogTrigger asChild>
				<Button className="cursor-pointer rounded-full">Login</Button>
			</DialogTrigger>
			<DialogContent
				className="rounded-xl sm:max-w-[400px]"
				// showCloseButton={false} // Hide default close button
			>
				{/* <DialogClose asChild>
					<Button
						variant="outline"
						size="icon"
						className="absolute top-4 right-4 opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
						onClick={handleCloseDialog}
					>
						<X className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</Button>
				</DialogClose> */}
				<DialogHeader>
					<DialogTitle className="text-xl md:text-2xl ">
						Start Building
					</DialogTitle>
					<DialogDescription className="text-base md:text-lg">
						Sign in to continue your magic journey
					</DialogDescription>
				</DialogHeader>

				{isOTP ? (
					<div className="flex w-full flex-col items-center justify-center gap-4">
						<InputOTP
							maxLength={6}
							value={otp}
							onChange={(value) => setOtp(value)}
						>
							<InputOTPGroup>
								<InputOTPSlot index={0} />
								<InputOTPSlot index={1} />
								<InputOTPSlot index={2} />
							</InputOTPGroup>
							<InputOTPSeparator />
							<InputOTPGroup>
								<InputOTPSlot index={3} />
								<InputOTPSlot index={4} />
								<InputOTPSlot index={5} />
							</InputOTPGroup>
						</InputOTP>
						{isLoading && <Spinner className="size-4" />}
						<div
							className={cn(
								"flex cursor-pointer items-center gap-2",
								isLoading && "cursor-not-allowed",
							)}
							onClick={() => setIsOTP(false)}
						>
							<ArrowLeft className="size-4" />
							<span className="text-xs sm:text-sm">Go back</span>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{!isSwitchEmail ? (
							<>
								<OauthGroup />
								<OrSeparator />
								<Button
									onClick={() => setIsSwitchEmail(true)}
									variant="default"
									className="cussor-pointer relative p-2"
								>
									Sign in with email
								</Button>
							</>
						) : (
							<>
								<div className="flex flex-col gap-3">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										name="email"
										type="email"
										value={email}
										placeholder="Enter your email address"
										onChange={(e) => setEmail(e.target.value)}
									/>
									{error && (
										<Alert variant="destructive">
											<AlertCircleIcon />
											<AlertTitle>{error}</AlertTitle>
										</Alert>
									)}
									{/* Next button */}
									<Button onClick={handleEmailLogin}>
										{isLoading ? (
											<Spinner className="size-4" />
										) : (
											<>
												Next
												<ArrowRightIcon className="size-4" />
											</>
										)}
									</Button>
								</div>
								<OrSeparator />
								<OauthGroup />
							</>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default LoginDialog;
