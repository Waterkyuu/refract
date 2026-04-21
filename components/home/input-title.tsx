import { useTranslations } from "next-intl";

const InputTitle = () => {
	const t = useTranslations("home");

	return (
		<div className="flex flex-col items-center justify-center gap-4">
			<h1 className="mb-4 w-full text-center font-lora text-2xl sm:text-3xl md:text-4xl">
				{t("title")}
			</h1>
		</div>
	);
};

export default InputTitle;
