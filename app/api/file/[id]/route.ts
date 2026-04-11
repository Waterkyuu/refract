import { getFileRecordStatus } from "@/lib/file-store";
import { type NextRequest, NextResponse } from "next/server";

type FileRouteContext = {
	params: Promise<{ id: string }>;
};

const GET = async (_req: NextRequest, { params }: FileRouteContext) => {
	try {
		const { id } = await params;
		const record = await getFileRecordStatus(id);

		return NextResponse.json({
			code: 0,
			success: true,
			message: "File status fetched.",
			data: record,
		});
	} catch (error) {
		return NextResponse.json(
			{
				code: 404,
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Unable to find file record.",
			},
			{ status: 404 },
		);
	}
};

export { GET };
