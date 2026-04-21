import { useTranslations } from "next-intl";

const Footer = () => {
	const t = useTranslations("footer");

	return (
		<div className="fixed bottom-2 flex w-full items-center justify-between px-4 py-1">
			<div className="flex items-center gap-2">
				<a href="https://github.com/waterkyuu/fire-wave-agent">
					<img
						src="/images/platform/github.svg"
						alt="Github logo"
						className="size-4 md:size-5"
					/>
				</a>
				<a href="https://github.com/waterkyuu/fire-wave-agent">
					<img
						src="/images/platform/new-x.svg"
						alt="X logo"
						className="size-4 md:size-5"
					/>
				</a>
				<a href="/https://github.com/waterkyuu/fire-wave-agent">
					<img
						src="/images/platform/discord.svg"
						alt="Discord logo"
						className="size-4 md:size-5"
					/>
				</a>
			</div>
			<div className="flex items-center gap-2 font-medium text-gray-600 text-xs md:text-sm">
				<span>{t("privacy")} /</span>
				<span>{t("terms")} /</span>
				<span>{t("helpCenter")} /</span>
			</div>
		</div>
	);
};

export default Footer;
