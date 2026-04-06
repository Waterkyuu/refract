import { memo } from "react";

const Footer = () => {
	return (
		<div className="fixed bottom-2 flex w-full items-center justify-between px-4 py-1">
			<div className="flex items-center gap-2">
				<a href="https://github/waterkyuu/fire-wave-agent">
					<img
						src="/images/platform/github.svg"
						alt="Github logo"
						className="size-4 md:size-5"
					/>
				</a>
				<a href="https://github/waterkyuu/fire-wave-agent">
					<img
						src="/images/platform/new-x.svg"
						alt="X logo"
						className="size-4 md:size-5"
					/>
				</a>
				<a href="/https://github/waterkyuu/fire-wave-agent">
					<img
						src="/images/platform/discord.svg"
						alt="Discord logo"
						className="size-4 md:size-5"
					/>
				</a>
			</div>
			<div className="flex items-center gap-2 font-medium text-gray-600 text-xs md:text-sm">
				<span>Privacy /</span>
				<span>Terms /</span>
				<span>Help Cneter /</span>
			</div>
		</div>
	);
};

export default memo(Footer);
