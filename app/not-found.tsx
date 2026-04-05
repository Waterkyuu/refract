import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

const NotFound = () => {
	return (
		<div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 md:px-8">
			<div className="flex w-full max-w-lg flex-col items-center gap-6 text-center sm:gap-8">
				<h1 className="font-bold font-lora text-7xl text-foreground tracking-tight sm:text-8xl md:text-9xl">
					404
				</h1>

				<div className="h-px w-12 bg-foreground/20 sm:w-16" />

				<div className="flex flex-col gap-4 sm:gap-6">
					<h2 className="font-lora font-semibold text-foreground text-xl sm:text-2xl">
						Page Not Found
					</h2>
					<p className="max-w-sm text-muted-foreground text-sm sm:max-w-md sm:text-base">
						The page you are looking for does not exist or has been moved.
					</p>
				</div>

				<Link
					href="/"
					className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 font-medium text-background text-sm transition-colors duration-200 hover:bg-foreground/80 sm:px-6 sm:py-3"
				>
					<ArrowLeftIcon className="size-4" />
					Back to Home
				</Link>
			</div>
		</div>
	);
};

export default NotFound;
