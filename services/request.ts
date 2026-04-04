/**
 * example:
	// GET
	const user = await request('GET', '/api/user/1', userSchema);
	// POST
	const created = await request('POST', '/api/user', userSchema, { name: 'tom' });
	// PUT
	const updated = await request('PUT', '/api/user/1', userSchema, { name: 'jerry' });
	// DELETE
	await request('DELETE', '/api/user/1', z.object({}));
*/

import type { AxiosRequestConfig, Method } from "axios";
import type { ZodSchema, z } from "zod";
import apiClient from "./api-client";

type HttpMethod = Extract<Method, "GET" | "POST" | "PUT" | "DELETE">;

/**
 * 统一请求函数
 * @param method  HTTP 动词，大写小写均可
 * @param url     请求地址
 * @param schema  Zod 校验模式
 * @param config  其他 Axios 配置
 * @param body    请求体（可选，GET/DELETE 可省略）
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

// 语法糖
export async function zodGet<T extends ZodSchema>(
	url: string,
	schema: T,
	config?: AxiosRequestConfig,
): Promise<z.infer<T>> {
	return request("GET", url, schema, undefined, config);
}

export async function zodPost<T extends ZodSchema>(
	url: string,
	body: unknown,
	schema: T,
	config?: AxiosRequestConfig,
): Promise<z.infer<T>> {
	return request("POST", url, schema, body, config);
}

export const zodPut = <T extends ZodSchema>(
	url: string,
	body: unknown,
	schema: T,
	config?: AxiosRequestConfig,
) => request("PUT", url, schema, body, config);

export const zodDelete = <T extends ZodSchema>(
	url: string,
	schema: T,
	config?: AxiosRequestConfig,
) => request("DELETE", url, schema, undefined, config);
