// Formats file size to human-readable format (e.g., KB, MB)
const formatFileSize = (bytes: number) => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Number.parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i];
};

// Keep dataset extension rules in one place so UI and service logic stay consistent.
const DATASET_EXTENSIONS = new Set(["csv", "xlsx", "xls"]);

// Normalizes both "csv" and "report.csv" into a lowercase extension token.
const getLowercaseExtension = (filenameOrExtension: string) => {
	const normalized = filenameOrExtension.trim().toLowerCase();
	if (!normalized) {
		return "";
	}

	const suffix = normalized.split(".").pop();
	return suffix ?? normalized;
};

// Determines whether an extension represents a dataset format we can parse.
const isDatasetExtension = (extension: string) =>
	DATASET_EXTENSIONS.has(getLowercaseExtension(extension));

// Determines whether a filename belongs to a dataset file.
const isDatasetFilename = (filename: string) =>
	isDatasetExtension(getLowercaseExtension(filename));

export {
	formatFileSize,
	DATASET_EXTENSIONS,
	getLowercaseExtension,
	isDatasetExtension,
	isDatasetFilename,
};
