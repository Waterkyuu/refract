import type { ApiResponse } from "@/types";
// import type { ApiResponse } from "@/types";
import axios, {
	type AxiosResponse,
	type InternalAxiosRequestConfig,
	type AxiosError,
} from "axios";
import { toast } from "sonner";

const baseURL =
	process.env.NODE_ENV === "development"
		? "http://localhost:3000/api/v1"
		: "https://xuebantong.org/api/v1";

const apiClient = axios.create({
	baseURL: baseURL,
	withCredentials: true,
});

// 定义业务状态码类型
const resultEnum: Record<string, number> = {
	success: 0, // 请求成功
	unauthorized: 401, // token 无效
	sensitive: 105, // 涉及敏感词
};

// 添加请求拦截器
apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		if (typeof window !== "undefined") {
			const token = localStorage.getItem("token");
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			} else {
				// const cookies = document.cookie.split(";");
				// for (const cookie of cookies) {
				// 	const eqIndex = cookie.indexOf("=");
				// 	if (eqIndex === -1) continue;
				// 	const name = cookie.substring(0, eqIndex).trim();
				// 	const value = cookie.substring(eqIndex + 1);
				// 	// 查找包含 neon 或 auth 相关的 cookie
				// 	if (
				// 		name.toLowerCase().includes("neon") ||
				// 		name.toLowerCase().includes("auth") ||
				// 		name.toLowerCase().includes("session")
				// 	) {
				// 		config.headers.Authorization = `Bearer ${value}`;
				// 		break;
				// 	}
				// }
			}
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// 添加响应拦截器
apiClient.interceptors.response.use(
	// 处理业务逻辑 将请求成功的状态码都设置2xx
	(response: AxiosResponse<ApiResponse>) => {
		// 状态码在 2xx范围内的任何请求都会触发此功能
		const { code, success, data, message } = response.data || {};

		// 如果成功 直接返回data 避免重复写 data.data
		if (code === resultEnum.success && success) {
			return data as unknown as AxiosResponse; // 强制声明就是AxiosResponse
		}

		const validMsg = message || "Internal unknown error";

		return Promise.reject(new Error(validMsg));
	},

	// 处理非业务逻辑 如网络请求等
	(error: AxiosError<ApiResponse>) => {
		const data = error.response?.data;

		const code = data?.code;
		const msg = data?.message;

		const errorMsg = msg || error.message;

		const status = error.response?.status;

		if (status === 401) {
			if (typeof window !== "undefined") {
				// Trigger login dialog to show
				// jotaiStore.set(loginDialogAtom, true);
			}
		}

		if (typeof window !== "undefined") toast.error(errorMsg);

		// 返回reject才能捕获到这次失败
		return Promise.reject(new Error(errorMsg));
	},
);

export default apiClient;
