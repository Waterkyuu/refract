import { atom } from "jotai";

/**
 * Atom to control login dialog visibility
 * When set to true, the login dialog will be shown (typically triggered by 401 Unauthorized)
 */
const loginDialogAtom = atom(false);

export default loginDialogAtom;
