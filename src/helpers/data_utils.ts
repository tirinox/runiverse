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