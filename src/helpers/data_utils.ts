import * as crypto from "crypto-js";

const byteToHex: Array<string> = [];

for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, "0");
    byteToHex.push(hexOctet);
}

export function hex(buff: Uint8Array): string {
    const hexOctets = [];

    for (let i = 0; i < buff.length; ++i)
        hexOctets.push(byteToHex[buff[i]]);

    return hexOctets.join("");
}

export function hexToBigInt(input: string): BigInt {
    if (input.length % 2) {
        input = '0' + input;
    }

    return BigInt('0x' + input);
}

export function truncateStringAtMiddle(text: string, startChars: number, endChars: number, maxLength: number): string {
    if (text.length > maxLength) {
        var start = text.substring(0, startChars);
        var end = text.substring(text.length - endChars, text.length);
        return start + '...' + end;
    }
    return text;
}

export function truncStringTail(text: string, maxLength: number = 10): string {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...'
    } else {
        return text
    }
}

export function lastElement<Type>(arg: Array<Type>): Type {
    return arg[arg.length - 1]
}

export function easyHash(input: string): string {
    return crypto.SHA256(input).toString(crypto.enc.Hex)
}

const HASH_PAR_BITS = 32
const HASH_PAR_HEX_DIGITS = HASH_PAR_BITS / 4
const HASH_PAR_DENOM = 2 ** HASH_PAR_BITS
const HASH_PAR_SALT = 'HashedSaltBro1242'

export function hashedParameterFloat01(input: string, path: string) {
    const rehashed = easyHash(HASH_PAR_SALT + input + path)
    const part = parseInt(rehashed.substring(0, HASH_PAR_HEX_DIGITS), 16)
    return part / HASH_PAR_DENOM
}

export function hashedParameterFloat(input: string, path: string, min: number = 0.0, max: number = 0.0) {
    const f01 = hashedParameterFloat01(input, path)
    return min + f01 * (max - min)
}

export function hashedParameterInt(input: string, path: string, min: number = 0, max: number = 0) {
    const n = hashedParameterFloat(input, path, min, max)
    return Math.round(n)
}

export function hashedParameterChoice(input: string, path: string, collection: Array<any>) {
    const n = hashedParameterInt(input, path, 0, collection.length - 1)
    return collection[n]
}
