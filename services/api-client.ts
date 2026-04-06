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
		: "https://fire-wave/api/";

const apiClient = axios.create({
	baseURL: baseURL,
	withCredentials: true,
});

const resultEnum: Record<string, number> = {
	success: 0,
	unauthorized: 401,
	sensitive: 105,
};

apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		return config;
	},
	(error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
	(response: AxiosResponse<ApiResponse>) => {
		const { code, success, data, message } = response.data || {};

		if (code === resultEnum.success && success) {
			return data as unknown as AxiosResponse;
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
				jotaiStore.set(loginDialogAtom, true);
			}
		}

		if (typeof window !== "undefined") toast.error(errorMsg);

		return Promise.reject(new Error(errorMsg));
	},
);

export default apiClient;
