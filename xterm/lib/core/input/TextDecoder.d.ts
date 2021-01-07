export declare class StringToUtf32 {
    private _interim;
    clear(): void;
    decode(input: string, target: Uint32Array): number;
}
export declare function stringFromCodePoint(codePoint: number): string;
export declare function utf32ToString(data: Uint32Array, start?: number, end?: number): string;
