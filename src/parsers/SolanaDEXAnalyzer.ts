import { BinaryFileAnalyzer } from "./BinaryFileAnalyzer.js";

interface TokenPair {
  baseToken: string;
  quoteToken: string;
  price?: number;
  liquidity?: number;
}

class SolanaDEXAnalyzer extends BinaryFileAnalyzer {
  private static SOLANA_PUBKEY_LENGTH = 32;

  public analyzeDEXHeader() {
    const firstByte = this.readUInt8();
    this.skip(1); // Skip newline
    const version = this.readNullTerminatedString();
    const identifier = this.readNullTerminatedString();

    console.log("=== DEX File Header ===");
    console.log(`Version: ${version}`);
    console.log(`Type: ${identifier}`);
    console.log(`Format: ${firstByte === 0 ? "Standard" : "Unknown"}`);
  }

  public readSolanaPublicKey(): string {
    const bytes = this.readBytes(SolanaDEXAnalyzer.SOLANA_PUBKEY_LENGTH);
    return Buffer.from(bytes).toString("base64");
  }

  public analyzePairs() {
    console.log("\n=== Trading Pairs Analysis ===");

    // Try to identify token pairs
    const pairs: TokenPair[] = [];

    while (this.getCurrentPosition() < this.getFileSize() - SolanaDEXAnalyzer.SOLANA_PUBKEY_LENGTH) {
      const currentPos = this.getCurrentPosition();
      const peek = this.peek(4).toString();

      if (peek.includes("SOL") || peek.includes("ray")) {
        const pair: TokenPair = {
          baseToken: this.readString(32).trim(),
          quoteToken: this.readString(32).trim(),
        };

        // Try to read price data if available
        const possiblePrice = this.readBytes(8);
        if (this.isValidPrice(possiblePrice)) {
          pair.price = possiblePrice.readDoubleLE(0);
        }

        pairs.push(pair);
      } else {
        this.skip(1);
      }
    }

    // Print found pairs
    pairs.forEach((pair, index) => {
      console.log(`\nPair ${index + 1}:`);
      console.log(`Base Token: ${pair.baseToken}`);
      console.log(`Quote Token: ${pair.quoteToken}`);
      if (pair.price) console.log(`Price: ${pair.price}`);
    });
  }

  public findRaydiumSpecificData() {
    console.log("\n=== Raydium Specific Data ===");

    this.seek(0);
    while (this.getCurrentPosition() < this.getFileSize() - 8) {
      const peek = this.peek(8).toString();

      if (peek.includes("raydium")) {
        console.log("\nRaydium Data Block Found:");
        this.skip(8);

        // Read potential configuration data
        const config = this.readBytes(32);
        console.log("Configuration:", config.toString("hex"));

        // Look for AMM data
        if (this.peek(6).toString().includes("solamm")) {
          console.log("AMM Configuration Present");
        }
      } else {
        this.skip(1);
      }
    }
  }

  private isValidPrice(buffer: Buffer): boolean {
    const value = buffer.readDoubleLE(0);
    return !isNaN(value) && isFinite(value) && value > 0 && value < 1000000;
  }

  public analyzeWrappedSOL() {
    console.log("\n=== Wrapped SOL References ===");

    this.seek(0);
    while (this.getCurrentPosition() < this.getFileSize() - 11) {
      const peek = this.peek(11).toString();

      if (peek.includes("Wrapped SOL")) {
        console.log("\nWrapped SOL Entry Found:");
        this.skip(11);

        // Read potential pool data
        const poolData = this.readBytes(32);
        console.log("Associated Pool Data:", poolData.toString("hex"));
      } else {
        this.skip(1);
      }
    }
  }
}

// Usage function
function analyzeSolanaDEXFile(filePath: string) {
  const analyzer = new SolanaDEXAnalyzer(filePath);

  analyzer.analyzeDEXHeader();
  analyzer.analyzePairs();
  analyzer.findRaydiumSpecificData();
  analyzer.analyzeWrappedSOL();
}

export { SolanaDEXAnalyzer, analyzeSolanaDEXFile };
