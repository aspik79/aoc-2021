const values = '0123456789ABCDEF';

export class PacketDecoder {
    private bitString: string = '';
    constructor(s: string) {
        const data = s;
        for (let s of data) {
            const bin = hexToBin(s);
            this.bitString += hexToBin(s);
        }
    }

    /**
     * Collects the version numbers of the packets.
     */
    public doCalculation (v: number[]) : number {
        const bitArray = this.bitString.split('');
        return decodeAll(bitArray, v)[0];
    }
}

function decodeAll(bits: string[], versions: number[]) : number[] {
   
    let result: number[] = [];

    while (bits.length > 6) {
        result.push(decode(bits, versions));
    }

    return result;
}

function decode(bits: string[], versions: number[]) : number {

    const v = decodeBits(bits, 3);
    versions.push(v);

    const t = decodeBits(bits, 3);

    let result: number;

    if (t == 4) {
        result = decodeNumber(bits);
    }
    else {
         result = decodeOperator(t, bits, versions);
    }

    return result;
}

function hexToBin(s: string) : string {
    let n = values.indexOf(s);
    let result: string[] = [];

    for (let i = 0; i < 4; ++i) {
        result.unshift('' + (n % 2));
        n >>= 1;
    }

    return result.join('');
}

function decodeBits(bits: string[], n: number) : number {
    const vbits = bits.splice(0, n);

    let result = 0;
    while(vbits.length > 0) {
        result = 2 * result + parseInt(vbits.shift() as string);
    }
    
    return result;
}

function decodeNumber(bits: string[]) : number {
    let numBits: string[] = [];

    let keepGoing = true;
    while(keepGoing) {
        keepGoing = bits.shift() == '1';
        numBits.push(...bits.splice(0, 4));
    }

    return decodeBits(numBits, numBits.length);
}

function decodeOperator(type: number, bits: string[], versions: number[]) : number {
    const ltype = bits.shift();
    let values: number[] = [];

    if (ltype == '0') {
        const npackbits = decodeBits(bits, 15);
        const packetBits = bits.splice(0, npackbits);
        values = decodeAll(packetBits, versions);
    }
    else {
        const npack = decodeBits(bits, 11);
        for (let n = 0; n < npack; ++n) {
            values.push(decode(bits, versions));
        }
    }

    switch (type) {
        case 0:
            return values.reduce((s, v) => s + v, 0);
        case 1:
            return values.reduce((p, v) => p * v, 1);
        case 2:
            return Math.min(...values);
        case 3:
            return Math.max(...values);
        case 5:
            return values[0] > values[1] ? 1 : 0;
        case 6:
            return values[0] < values[1] ? 1 : 0;
        case 7:
            return values[0] == values[1] ? 1 : 0;
    }

    return 0;
}