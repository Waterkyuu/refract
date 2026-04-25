"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ConnectionService, ConnectionStatus } from "@/types";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "refract-connections";

const SERVICE_ICONS: Record<ConnectionService, string> = {
	github: "/images/platform/github.svg",
	notion: "/images/platform/notion.svg",
};

const SERVICE_KEYS: ConnectionService[] = ["github", "notion"];

const loadConnections = (): ConnectionStatus[] => {
	if (typeof window === "undefined") {
		return SERVICE_KEYS.map((s) => ({ service: s, connected: false }));
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw)
			return SERVICE_KEYS.map((s) => ({ service: s, connected: false }));
		return JSON.parse(raw);
	} catch {
		return SERVICE_KEYS.map((s) => ({ service: s, connected: false }));
	}
};

const saveConnections = (connections: ConnectionStatus[]) => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
};

const ConnectionsSettings = () => {
	const t = useTranslations("settings.connections");
	const tGlobal = useTranslations("settings");
	const [connections, setConnections] =
		useState<ConnectionStatus[]>(loadConnections);
	const [loadingService, setLoadingService] =
		useState<ConnectionService | null>(null);
	const [disconnectConfirm, setDisconnectConfirm] =
		useState<ConnectionService | null>(null);

	const getConnection = useCallback(
		(service: ConnectionService) =>
			connections.find((c) => c.service === service),
		[connections],
	);

	const handleConnect = useCallback(
		async (service: ConnectionService) => {
			setLoadingService(service);
			try {
				const updated = connections.map((c) =>
					c.service === service
						? { ...c, connected: true, connectedAt: Date.now() }
						: c,
				);
				setConnections(updated);
				saveConnections(updated);
				const serviceNameKey = `${service}.name` as const;
				toast.success(t("connectSuccess", { service: t(serviceNameKey) }));
			} catch {
				toast.error(t("operationFailed"));
			} finally {
				setLoadingService(null);
			}
		},
		[connections, t],
	);

	const handleDisconnect = useCallback(
		(service: ConnectionService) => {
			const updated = connections.map((c) =>
				c.service === service
					? { ...c, connected: false, connectedAt: undefined }
					: c,
			);
			setConnections(updated);
			saveConnections(updated);
			setDisconnectConfirm(null);
			const serviceNameKey = `${service}.name` as const;
			toast.success(t("disconnectSuccess", { service: t(serviceNameKey) }));
		},
		[connections, t],
	);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="font-semibold text-lg tracking-tight">{t("title")}</h2>
				<p className="mt-1 text-muted-foreground text-sm">{t("description")}</p>
			</div>

			<div className="divide-y rounded-lg border">
				{SERVICE_KEYS.map((service) => {
					const iconSrc = SERVICE_ICONS[service];
					const status = getConnection(service);
					const isConnected = status?.connected ?? false;
					const isLoading = loadingService === service;
					const serviceNameKey = `${service}.name` as const;
					const serviceDescKey = `${service}.description` as const;

					return (
						<div
							key={service}
							className="flex items-center justify-between px-4 py-4 transition-colors duration-200 hover:bg-accent/50"
						>
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-lg border bg-muted/50">
									<img
										src={iconSrc}
										alt={`${service}-icon`}
										className="size-5"
									/>
								</div>
								<div>
									<p className="font-medium text-sm">{t(serviceNameKey)}</p>
									<p className="text-muted-foreground text-xs">
										{t(serviceDescKey)}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<span
									className={cn(
										"font-medium text-xs",
										isConnected
											? "text-emerald-600 dark:text-emerald-400"
											: "text-muted-foreground",
									)}
								>
									{isConnected ? t("connected") : t("notConnected")}
								</span>
								{isConnected ? (
									<Button
										variant="outline"
										size="sm"
										onClick={() => setDisconnectConfirm(service)}
										disabled={isLoading}
									>
										{t("disconnect")}
									</Button>
								) : (
									<Button
										size="sm"
										onClick={() => handleConnect(service)}
										disabled={isLoading}
									>
										{isLoading ? t("connecting") : t("connect")}
									</Button>
								)}
							</div>
						</div>
					);
				})}
			</div>

			<Dialog
				open={disconnectConfirm !== null}
				onOpenChange={(open) => !open && setDisconnectConfirm(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("disconnect")}</DialogTitle>
						<DialogDescription>
							{disconnectConfirm
								? t("disconnectConfirm", {
										service: t(`${disconnectConfirm}.name` as const),
									})
								: ""}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDisconnectConfirm(null)}
						>
							{tGlobal("skills.cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={() =>
								disconnectConfirm && handleDisconnect(disconnectConfirm)
							}
						>
							{t("disconnect")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ConnectionsSettings;
