import fs from "fs";
import { ORe, Fh, T7e, C7e } from "./hope.js";

const filePath = "./src/buffer_1739122480201.bin";
const buffer = fs.readFileSync(filePath);

const yCr = Fh([C7e, T7e]);

const parser = new ORe(yCr.schemas);
try {
  const result = parser.decode(buffer);
  console.log(result);
} catch (error) {
  console.log(JSON.stringify(error));
}
