/**
 * Request utilities with Zod schema validation
 *
 * @example
 * // GET with response data
 * const user = await zodGet('/api/user/1', userSchema);
 *
 * // POST with response data
 * const created = await zodPost('/api/user', { name: 'tom' }, userSchema);
 *
 * // POST without response data (void)
 * await voidPost('/api/user/delete', { id: 1 });
 */

import type { AxiosRequestConfig, Method } from "axios";
import type { ZodSchema, z } from "zod";
import apiClient from "./api-client";

type HttpMethod = Extract<Method, "GET" | "POST" | "PUT" | "DELETE">;

/**
 * Generic request function with Zod schema validation
 * @param method  HTTP method
 * @param url     Request URL
 * @param schema  Zod schema for response validation
 * @param body    Request body (optional)
 * @param config  Additional Axios config
 */
export async function request<T extends ZodSchema>(
	method: HttpMethod,
	url: string,
	schema: T,
	body?: unknown,
	config?: AxiosRequestConfig,
): Promise<z.infer<T>> {
	try {
		const rawData = await apiClient.request({
			method,
			url,
			data: body,
			...config,
		});

		const result = schema.safeParse(rawData);
		if (result.success) return result.data;

		if (process.env.NODE_ENV === "development") {
			console.error(
				`API Schema Validation Failed [${method} ${url}]:`,
				result.error.format(),
			);
		}

		throw new Error(
			`Data verification failed: ${result.error.issues[0].message}`,
		);
	} catch (error) {
		if (error instanceof Error) throw error;
		throw new Error(String(error));
	}
}

/**
 * Void request function for APIs that return no data
 * Used for operations like delete, update status, etc.
 * @param method  HTTP method
 * @param url     Request URL
 * @param body    Request body (optional)
 * @param config  Additional Axios config
 */
export async function voidRequest(
	method: HttpMethod,
	url: string,
	body?: unknown,
	config?: AxiosRequestConfig,
): Promise<void> {
	try {
		await apiClient.request({
			method,
			url,
			data: body,
			...config,
		});
	} catch (error) {
		if (error instanceof Error) throw error;
		throw new Error(String(error));
	}
}

export const zodGet = <T extends ZodSchema>(
	url: string,
	schema: T,
	config?: AxiosRequestConfig,
): Promise<z.infer<T>> => request("GET", url, schema, undefined, config);

export const zodPost = <T extends ZodSchema>(
	url: string,
	body: unknown,
	schema: T,
	config?: AxiosRequestConfig,
): Promise<z.infer<T>> => request("POST", url, schema, body, config);

export const zodPut = <T extends ZodSchema>(
	url: string,
	body: unknown,
	schema: T,
	config?: AxiosRequestConfig,
): Promise<z.infer<T>> => request("PUT", url, schema, body, config);

export const zodDelete = <T extends ZodSchema>(
	url: string,
	schema: T,
	config?: AxiosRequestConfig,
): Promise<z.infer<T>> => request("DELETE", url, schema, undefined, config);

// ============ Convenience methods without response data ============

/**
 * POST request without response data validation
 * Use when the API returns null/empty response
 */
export const voidPost = (
	url: string,
	body?: unknown,
	config?: AxiosRequestConfig,
): Promise<void> => voidRequest("POST", url, body, config);

/**
 * PUT request without response data validation
 * Use when the API returns null/empty response
 */
export const voidPut = (
	url: string,
	body?: unknown,
	config?: AxiosRequestConfig,
): Promise<void> => voidRequest("PUT", url, body, config);

/**
 * DELETE request without response data validation
 * Use when the API returns null/empty response
 */
export const voidDelete = (
	url: string,
	config?: AxiosRequestConfig,
): Promise<void> => voidRequest("DELETE", url, undefined, config);
