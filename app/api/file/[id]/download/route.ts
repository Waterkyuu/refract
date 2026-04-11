import { getUploadedFileBytes } from "@/lib/file-store";
import { type NextRequest, NextResponse } from "next/server";

type FileDownloadRouteContext = {
	params: Promise<{ id: string }>;
};

const GET = async (_req: NextRequest, { params }: FileDownloadRouteContext) => {
	const { id } = await params;
	const { bytes, record } = await getUploadedFileBytes(id);
	const body = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(body).set(bytes);

	return new NextResponse(body, {
		headers: {
			"Content-Disposition": `attachment; filename="${encodeURIComponent(record.filename)}"`,
			"Content-Length": String(bytes.byteLength),
			"Content-Type": record.contentType ?? "application/octet-stream",
		},
		status: 200,
	});
};

export { GET };
