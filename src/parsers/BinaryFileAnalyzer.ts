import * as fs from "fs";

class BinaryFileAnalyzer {
  private buffer: Buffer;
  private position: number = 0;

  constructor(filePath: string) {
    this.buffer = fs.readFileSync(filePath);
  }

  public readBytes(length: number): Buffer {
    const result = this.buffer.subarray(this.position, this.position + length);
    this.position += length;
    return result;
  }

  public readUInt8(): number {
    const result = this.buffer.readUInt8(this.position);
    this.position += 1;
    return result;
  }

  public readUInt16LE(): number {
    const result = this.buffer.readUInt16LE(this.position);
    this.position += 2;
    return result;
  }

  public readUInt32LE(): number {
    const result = this.buffer.readUInt32LE(this.position);
    this.position += 4;
    return result;
  }

  public readString(length: number): string {
    const result = this.buffer.toString("utf8", this.position, this.position + length);
    this.position += length;
    return result;
  }

  public readNullTerminatedString(): string {
    let end = this.position;
    while (end < this.buffer.length && this.buffer[end] !== 0) {
      end++;
    }
    const result = this.buffer.toString("utf8", this.position, end);
    this.position = end + 1; // Skip the null terminator
    return result;
  }

  public peek(length: number): Buffer {
    return this.buffer.subarray(this.position, this.position + length);
  }

  public seek(position: number): void {
    this.position = position;
  }

  public skip(bytes: number): void {
    this.position += bytes;
  }

  public getCurrentPosition(): number {
    return this.position;
  }

  public getFileSize(): number {
    return this.buffer.length;
  }

  public hexDump(start: number = this.position, length: number = 16): string {
    let result = "";
    const end = Math.min(start + length, this.buffer.length);

    for (let i = start; i < end; i++) {
      result += this.buffer[i].toString(16).padStart(2, "0") + " ";
    }

    result += "   ";

    for (let i = start; i < end; i++) {
      const byte = this.buffer[i];
      result += byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
    }

    return result;
  }
}

// Example usage
async function analyzeFile(filePath: string) {
  const analyzer = new BinaryFileAnalyzer(filePath);
  console.log(`File size: ${analyzer.getFileSize()} bytes`);

  // Print first 64 bytes as hex dump
  for (let i = 0; i < 64; i += 16) {
    console.log(`${i.toString(16).padStart(8, "0")}: ${analyzer.hexDump(i)}`);
  }
}

export { BinaryFileAnalyzer, analyzeFile };
