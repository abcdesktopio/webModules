export declare const enum KeyboardResultType {
    SEND_KEY = 0,
    SELECT_ALL = 1,
    PAGE_UP = 2,
    PAGE_DOWN = 3
}
export interface IKeyboardResult {
    type: KeyboardResultType;
    cancel: boolean;
    key: string | undefined;
}
export interface ICharset {
    [key: string]: string;
}
