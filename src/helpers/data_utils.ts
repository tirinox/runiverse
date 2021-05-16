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
