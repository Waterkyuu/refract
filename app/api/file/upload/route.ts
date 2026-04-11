import { writeChunkFile } from "@/lib/file-store";
import { type NextRequest, NextResponse } from "next/server";

const POST = async (req: NextRequest) => {
	try {
		const formData = await req.formData();
		const chunk = formData.get("chunk");
		const filename = formData.get("filename");
		const index = Number(formData.get("index"));

		if (!(chunk instanceof File) || typeof filename !== "string") {
			return NextResponse.json(
				{
					code: 400,
					success: false,
					message: "Invalid upload payload.",
				},
				{ status: 400 },
			);
		}

		await writeChunkFile({
			chunk: new Uint8Array(await chunk.arrayBuffer()),
			filename,
			index,
		});

		return NextResponse.json({
			code: 0,
			success: true,
			message: "Chunk uploaded.",
			data: null,
		});
	} catch (error) {
		return NextResponse.json(
			{
				code: 500,
				success: false,
				message:
					error instanceof Error ? error.message : "Failed to upload chunk.",
			},
			{ status: 500 },
		);
	}
};

export { POST };
