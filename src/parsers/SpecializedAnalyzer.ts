import { BinaryFileAnalyzer } from "./BinaryFileAnalyzer.js";

class SpecializedAnalyzer extends BinaryFileAnalyzer {
  public analyzeHeader() {
    // Read first byte (0x00)
    const firstByte = this.readUInt8();
    console.log("First byte:", firstByte);

    // Read version string (1.3.0)
    this.skip(1); // Skip 0x0a
    const version = this.readNullTerminatedString();
    console.log("Version:", version);

    // Read "pairs" string
    const identifier = this.readNullTerminatedString();
    console.log("Identifier:", identifier);
  }

  public analyzeDataBlocks() {
    // Starting from position 16 (0x10)
    this.seek(16);

    // Analyze what appears to be repeating data structures
    for (let i = 0; i < 3; i++) {
      console.log(`\nBlock ${i + 1}:`);

      // Read what appears to be a double-precision floating point number
      const bytes = this.readBytes(8);
      const value = bytes.readDoubleLE(0);
      console.log(`Value: ${value}`);

      // Read what appears to be padding or additional data
      const additionalData = this.readBytes(8);
      console.log("Additional data:", additionalData.toString("hex"));
    }
  }

  public findPatterns() {
    this.seek(0);

    // Look for repeating patterns
    const patterns: { [key: string]: number } = {};

    for (let i = 0; i < this.getFileSize() - 8; i++) {
      const chunk = this.peek(8).toString("hex");
      patterns[chunk] = (patterns[chunk] || 0) + 1;
      this.skip(1);
    }

    // Report patterns that appear more than once
    console.log("\nRepeating patterns:");
    for (const [pattern, count] of Object.entries(patterns)) {
      if (count > 1) {
        console.log(`Pattern ${pattern} appears ${count} times`);
      }
    }
  }

  public searchForStrings() {
    this.seek(0);
    const strings: string[] = [];
    let currentString = "";

    while (this.getCurrentPosition() < this.getFileSize()) {
      const byte = this.readUInt8();
      if (byte >= 32 && byte <= 126) {
        // Printable ASCII
        currentString += String.fromCharCode(byte);
      } else if (currentString.length > 3) {
        // Only keep strings longer than 3 chars
        strings.push(currentString);
        currentString = "";
      } else {
        currentString = "";
      }
    }

    console.log("\nFound strings:");
    strings.forEach((str) => console.log(`- ${str}`));
  }
}

// Example usage
function analyzeSpecificFile(filePath: string) {
  const analyzer = new SpecializedAnalyzer(filePath);

  console.log("=== File Header Analysis ===");
  analyzer.analyzeHeader();

  console.log("\n=== Data Blocks Analysis ===");
  analyzer.analyzeDataBlocks();

  console.log("\n=== Pattern Analysis ===");
  analyzer.findPatterns();

  console.log("\n=== String Search ===");
  analyzer.searchForStrings();
}

export { SpecializedAnalyzer, analyzeSpecificFile };
