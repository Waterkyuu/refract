import { getDefaultStore } from "jotai";

const jotaiStore = getDefaultStore();

export default jotaiStore;

export * from "./user";
export * from "./login-dialog";
