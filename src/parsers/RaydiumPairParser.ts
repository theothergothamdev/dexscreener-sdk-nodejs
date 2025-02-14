import { BinaryFileAnalyzer } from "./BinaryFileAnalyzer.js";

interface RaydiumPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  };
  price: string;
  priceUsd: string;
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
}

// Base58 alphabet
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(buffer: Buffer): string {
  let num = BigInt("0x" + buffer.toString("hex"));
  const base = BigInt(58);
  const zero = BigInt(0);
  const digits: number[] = [];

  while (num > zero) {
    digits.unshift(Number(num % base));
    num = num / base;
  }

  // Add leading zeros from the buffer
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    digits.unshift(0);
  }

  return digits.map((digit) => ALPHABET[digit]).join("");
}

export class RaydiumPairParserV3 extends BinaryFileAnalyzer {
  private readSolanaAddress(): string {
    // Solana addresses are 32 bytes, base58 encoded
    const addressBytes = this.readBytes(32);
    return encodeBase58(addressBytes);
  }

  public readString(): string {
    let result = "";
    let byte;
    while ((byte = this.readUInt8()) !== 0) {
      if (byte === 0x0a) return result;
      result += String.fromCharCode(byte);
    }
    return result;
  }

  private readPrice(): string {
    const buffer = this.readBytes(8);
    const value = buffer.readDoubleLE(0);
    return value.toFixed(8);
  }

  public parseHeader() {
    // Skip initial byte and newline
    this.skip(2);

    // Read version
    const version = this.readString();
    // Read type
    const type = this.readString();

    return { version, type };
  }

  public parsePair(): RaydiumPair | null {
    try {
      // Read magic number or identifier
      const magic = this.readBytes(4);
      if (magic.every((byte) => byte === 0)) {
        return null; // End of pairs section
      }

      const pair: RaydiumPair = {
        chainId: "solana",
        dexId: "raydium",
        pairAddress: this.readSolanaAddress(),
        baseToken: {
          address: this.readSolanaAddress(),
          name: this.readString(),
          symbol: this.readString(),
          decimals: this.readUInt8(),
        },
        quoteToken: {
          address: this.readSolanaAddress(),
          name: this.readString(),
          symbol: this.readString(),
          decimals: this.readUInt8(),
        },
        price: this.readPrice(),
        priceUsd: this.readPrice(),
        liquidity: {
          usd: parseFloat(this.readPrice()),
          base: parseFloat(this.readPrice()),
          quote: parseFloat(this.readPrice()),
        },
      };

      return pair;
    } catch (error) {
      console.error("Error parsing pair:", error);
      return null;
    }
  }

  public parseAll(): RaydiumPair[] {
    const header = this.parseHeader();
    console.log("Version:", header.version);
    console.log("Type:", header.type);

    const pairs: RaydiumPair[] = [];
    let pair;

    while ((pair = this.parsePair()) !== null) {
      pairs.push(pair);
      console.log("\nFound pair:", pair.baseToken.symbol, "/", pair.quoteToken.symbol);
      console.log("Price:", pair.price, "SOL ($" + pair.priceUsd + ")");
      console.log("Liquidity: $" + pair.liquidity.usd.toFixed(2));
    }

    return pairs;
  }
}
