"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { SettingTab } from "@/types";
import { useCallback, useState } from "react";
import ConnectionsSettings from "./components/connections-settings";
import LeftTabs from "./components/left-tabs";
import SkillSettings from "./components/skill-settings";
import SystemSettings from "./components/system-settings";

const SettingsPage = () => {
	const [activeTab, setActiveTab] = useState<SettingTab>("system");

	const handleTabChange = useCallback((tab: SettingTab) => {
		setActiveTab(tab);
	}, []);

	return (
		<div className="flex h-dvh flex-col">
			<div className="mx-auto flex w-full max-w-5xl flex-1 overflow-hidden px-4 py-6 md:px-6">
				<div className="grid w-full grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
					<LeftTabs activeTab={activeTab} onChange={handleTabChange} />

					<ScrollArea className="h-full">
						<div className="pr-4 pb-8">
							{activeTab === "system" && <SystemSettings />}
							{activeTab === "skills" && <SkillSettings />}
							{activeTab === "connections" && <ConnectionsSettings />}
						</div>
					</ScrollArea>
				</div>
			</div>
		</div>
	);
};

export default SettingsPage;
