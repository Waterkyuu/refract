import jotaiStore from "@/atoms";
import loginDialogAtom from "@/atoms/login-dialog";
import type { ApiResponse } from "@/types";
import axios, {
	type AxiosResponse,
	type InternalAxiosRequestConfig,
	type AxiosError,
} from "axios";
import { toast } from "sonner";

const baseURL =
	process.env.NODE_ENV === "development"
		? "http://localhost:3000/api/v1"
		: "https://agent-dashboard/api/v1";

const apiClient = axios.create({
	baseURL: baseURL,
	withCredentials: true,
});

// Define the type of business status code
const resultEnum: Record<string, number> = {
	success: 0,
	unauthorized: 401,
	sensitive: 105,
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

apiClient.interceptors.response.use(
	(response: AxiosResponse<ApiResponse>) => {
		const { code, success, data, message } = response.data || {};

		if (code === resultEnum.success && success) {
			return data as unknown as AxiosResponse; // A mandatory declaration is AxiosResponse
		}

		const validMsg = message || "Internal unknown error";

		return Promise.reject(new Error(validMsg));
	},

	(error: AxiosError<ApiResponse>) => {
		const data = error.response?.data;

		const code = data?.code;
		const msg = data?.message;

		const errorMsg = msg || error.message;

		const status = error.response?.status;

		if (status === 401) {
			if (typeof window !== "undefined") {
				// Trigger login dialog to show
				jotaiStore.set(loginDialogAtom, true);
			}
		}

		if (typeof window !== "undefined") toast.error(errorMsg);

		return Promise.reject(new Error(errorMsg));
	},
);

export default apiClient;
