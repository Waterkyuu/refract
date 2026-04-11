import { cancelUploadByFilename } from "@/lib/file-store";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CancelBodySchema = z.object({
	filename: z.string().min(1),
});

const POST = async (req: NextRequest) => {
	try {
		const body = CancelBodySchema.parse(await req.json());
		await cancelUploadByFilename(body.filename);

		return NextResponse.json({
			code: 0,
			success: true,
			message: "Upload canceled.",
			data: null,
		});
	} catch (error) {
		return NextResponse.json(
			{
				code: 500,
				success: false,
				message:
					error instanceof Error ? error.message : "Failed to cancel upload.",
			},
			{ status: 500 },
		);
	}
};

export { POST };
