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
			{/* Silver crystal core glow */}
			<div
				className="absolute inset-0 rounded-[2.5rem]"
				style={{
					background:
						"radial-gradient(circle, rgba(192, 200, 210, 0.45) 0%, rgba(160, 174, 192, 0.2) 35%, rgba(120, 140, 165, 0.08) 60%, transparent 80%)",
					filter: "blur(40px)",
				}}
			/>
			{/* Crystal refraction shimmer */}
			<div
				className="absolute inset-0 rounded-[2.5rem]"
				style={{
					background:
						"radial-gradient(ellipse at 30% 40%, rgba(220, 225, 235, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(200, 210, 225, 0.25) 0%, transparent 50%)",
					filter: "blur(50px)",
				}}
			/>
			{/* Outer frosted halo */}
			<div
				className="absolute inset-0 rounded-[2.5rem]"
				style={{
					background:
						"radial-gradient(circle, rgba(180, 190, 205, 0.15) 0%, rgba(140, 155, 175, 0.06) 50%, transparent 75%)",
					filter: "blur(70px)",
				}}
			/>
		</div>
	);
};

export default AmbientGlow;
