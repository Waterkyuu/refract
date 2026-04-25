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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateId } from "@/lib/utils";
import type { Skill, SkillFormState } from "@/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "refract-skills";

const loadSkills = (): Skill[] => {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
};

const saveSkills = (skills: Skill[]) => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
};

const initialFormState: SkillFormState = {
	name: "",
	description: "",
	instructions: "",
};

const SkillSettings = () => {
	const t = useTranslations("settings.skills");
	const [skills, setSkills] = useState<Skill[]>(loadSkills);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [form, setForm] = useState<SkillFormState>(initialFormState);
	const [saving, setSaving] = useState(false);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

	const openCreate = useCallback(() => {
		setForm(initialFormState);
		setDialogOpen(true);
	}, []);

	const openEdit = useCallback((skill: Skill) => {
		setForm({
			id: skill.id,
			name: skill.name,
			description: skill.description,
			instructions: skill.instructions,
		});
		setDialogOpen(true);
	}, []);

	const handleSave = useCallback(() => {
		if (!form.name.trim()) {
			toast.error(t("nameRequired"));
			return;
		}
		if (!form.instructions.trim()) {
			toast.error(t("instructionsRequired"));
			return;
		}

		setSaving(true);
		try {
			const now = Date.now();
			if (form.id) {
				const updated = skills.map((s) =>
					s.id === form.id
						? {
								...s,
								name: form.name,
								description: form.description,
								instructions: form.instructions,
								updatedAt: now,
							}
						: s,
				);
				setSkills(updated);
				saveSkills(updated);
				toast.success(t("updated"));
			} else {
				const newSkill: Skill = {
					id: generateId(),
					name: form.name.trim(),
					description: form.description.trim(),
					instructions: form.instructions.trim(),
					createdAt: now,
					updatedAt: now,
				};
				const updated = [...skills, newSkill];
				setSkills(updated);
				saveSkills(updated);
				toast.success(t("created"));
			}
			setDialogOpen(false);
		} catch {
			toast.error(t("operationFailed"));
		} finally {
			setSaving(false);
		}
	}, [form, skills, t]);

	const handleDelete = useCallback(
		(id: string) => {
			const updated = skills.filter((s) => s.id !== id);
			setSkills(updated);
			saveSkills(updated);
			setDeleteConfirmId(null);
			toast.success(t("deleted"));
		},
		[skills, t],
	);

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between">
				<div>
					<h2 className="font-semibold text-lg tracking-tight">{t("title")}</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						{t("description")}
					</p>
				</div>
				<Button onClick={openCreate} size="sm" className="gap-1.5">
					<Plus className="size-4" />
					{t("createSkill")}
				</Button>
			</div>

			{skills.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
					<p className="font-medium text-sm">{t("emptyTitle")}</p>
					<p className="mt-1 text-muted-foreground text-xs">
						{t("emptyDescription")}
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={openCreate}
						className="mt-4 gap-1.5"
					>
						<Plus className="size-4" />
						{t("createSkill")}
					</Button>
				</div>
			) : (
				<div className="divide-y rounded-lg border">
					{skills.map((skill) => (
						<div
							key={skill.id}
							className="group flex items-center justify-between px-4 py-3 transition-colors duration-200 hover:bg-accent/50"
						>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium text-sm">{skill.name}</p>
								{skill.description && (
									<p className="mt-0.5 truncate text-muted-foreground text-xs">
										{skill.description}
									</p>
								)}
							</div>
							<div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => openEdit(skill)}
									aria-label={t("edit")}
								>
									<Pencil className="size-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => setDeleteConfirmId(skill.id)}
									aria-label={t("delete")}
								>
									<Trash2 className="size-3.5 text-destructive" />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{form.id ? t("edit") : t("createSkill")}</DialogTitle>
						<DialogDescription>{t("description")}</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="skill-name">{t("skillName")}</Label>
							<Input
								id="skill-name"
								placeholder={t("skillNamePlaceholder")}
								value={form.name}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, name: e.target.value }))
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="skill-desc">{t("skillDescription")}</Label>
							<Input
								id="skill-desc"
								placeholder={t("skillDescriptionPlaceholder")}
								value={form.description}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, description: e.target.value }))
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="skill-instructions">
								{t("skillInstructions")}
							</Label>
							<Textarea
								id="skill-instructions"
								placeholder={t("skillInstructionsPlaceholder")}
								value={form.instructions}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, instructions: e.target.value }))
								}
								className="min-h-[140px] resize-y"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setDialogOpen(false)}>
							{t("cancel")}
						</Button>
						<Button onClick={handleSave} disabled={saving}>
							{saving ? t("saving") : t("save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteConfirmId !== null}
				onOpenChange={(open) => !open && setDeleteConfirmId(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("delete")}</DialogTitle>
						<DialogDescription>{t("deleteConfirm")}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
							{t("cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
						>
							{t("delete")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default SkillSettings;
