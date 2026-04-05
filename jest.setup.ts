import "@testing-library/jest-dom";

if (typeof globalThis.TransformStream === "undefined") {
	Object.defineProperty(globalThis, "TransformStream", {
		value: class TransformStream {
			readable: ReadableStream;
			writable: WritableStream;
			constructor() {
				const { readable, writable } = new IdentityTransformStream();
				this.readable = readable;
				this.writable = writable;
			}
		},
		writable: true,
	});
}

if (typeof globalThis.ReadableStream === "undefined") {
	Object.defineProperty(globalThis, "ReadableStream", {
		value: class ReadableStream {
			getReader() {
				return this;
			}
		},
		writable: true,
	});
}

if (typeof globalThis.WritableStream === "undefined") {
	Object.defineProperty(globalThis, "WritableStream", {
		value: class WritableStream {
			getWriter() {
				return this;
			}
		},
		writable: true,
	});
}
