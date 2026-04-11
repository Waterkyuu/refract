type WorkerMessage =
	| { type: "init" }
	| { type: "compile"; content: string }
	| { type: "terminate" };

type WorkerResponse =
	| { type: "init-start"; message: string }
	| { type: "init-complete" }
	| { type: "compile-start" }
	| { type: "compile-complete"; svg: string }
	| { type: "error"; error: string };

export type { WorkerMessage, WorkerResponse };
