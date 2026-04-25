import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SettingTab } from "@/types";
import { useTranslations } from "next-intl";

const TABS: {
	key: SettingTab;
	icon: React.ComponentType<{ className?: string }>;
}[] = [
	{ key: "system", icon: () => null },
	{ key: "skills", icon: () => null },
	{ key: "connections", icon: () => null },
];

const LeftTabs = ({
	activeTab,
	onChange,
}: {
	activeTab: string;
	onChange: (tab: SettingTab) => void;
}) => {
	const t = useTranslations("settings");

	return (
		<nav className="flex gap-1 md:flex-col">
			{TABS.map(({ key }) => (
				<Button
					key={key}
					variant="ghost"
					className={cn(
						"justify-start font-medium text-sm transition-colors duration-200",
						activeTab === key
							? "bg-accent text-accent-foreground"
							: "text-muted-foreground hover:text-foreground",
					)}
					onClick={() => onChange(key)}
				>
					{t(`tabs.${key}`)}
				</Button>
			))}
		</nav>
	);
};

export default LeftTabs;
