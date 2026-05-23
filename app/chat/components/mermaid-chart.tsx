"use client";

import { handleError } from "@/lib/error-handler";
import mermaid from "mermaid";
import { useEffect, useId, useState } from "react";

mermaid.initialize({
	startOnLoad: false,
	theme: "default",
	securityLevel: "loose",
});

const Mermaid = ({ chart }: { chart: string }) => {
	const [svg, setSvg] = useState("");
	const uniqueId = useId();

	useEffect(() => {
		if (!chart) return;

		const renderChart = async () => {
			try {
				const id = `mermaid-${uniqueId}-${Math.random().toString(36).slice(2, 9)}`;
				if (await mermaid.parse(chart)) {
					const { svg: rendered } = await mermaid.render(id, chart);
					setSvg(rendered);
				}
			} catch (error) {
				handleError(error);
			}
		};

		renderChart();
	}, [chart, uniqueId]);

	return (
		<div
			className="flex justify-center rounded-lg p-4 text-sm"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: content is sanitized by mermaid library
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	);
};

export default Mermaid;
