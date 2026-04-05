import { cn } from "@/lib/utils";

type AmbientGlowProps = {
	className?: string;
	size?: "default" | "md" | "sm";
};

const sizeVariants = {
	default: {
		container: "w-full h-32 md:w-[38rem] md:h-36 lg:w-[45rem] lg:h-40",
	},
	md: {
		container: "w-full h-24 md:w-24 md:h-28 lg:w-28 lg:h-32",
	},
	sm: {
		container: "w-full h-20 md:w-72 md:h-24 lg:w-80 lg:h-28",
	},
};

const AmbientGlow = ({ className, size = "default" }: AmbientGlowProps) => {
	return (
		<div
			className={cn(
				"-z-10 pointer-events-none absolute",
				sizeVariants[size].container,
				className,
			)}
		>
			<div
				className="absolute inset-0 rounded-[2.5rem]"
				style={{
					background:
						"radial-gradient(circle, rgba(140, 150, 165, 0.55) 0%, rgba(110, 125, 148, 0.3) 35%, rgba(75, 90, 115, 0.12) 60%, transparent 80%)",
					filter: "blur(40px)",
				}}
			/>
			<div
				className="absolute inset-0 rounded-[2.5rem]"
				style={{
					background:
						"radial-gradient(ellipse at 30% 40%, rgba(180, 188, 200, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(155, 165, 182, 0.3) 0%, transparent 50%)",
					filter: "blur(50px)",
				}}
			/>
			<div
				className="absolute inset-0 rounded-[2.5rem]"
				style={{
					background:
						"radial-gradient(circle, rgba(130, 142, 160, 0.22) 0%, rgba(95, 110, 135, 0.1) 50%, transparent 75%)",
					filter: "blur(70px)",
				}}
			/>
		</div>
	);
};

export default AmbientGlow;
