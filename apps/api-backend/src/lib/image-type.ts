import type { FitCheckMediaType } from "@omardtf/shared-types";

/** Detects jpeg/png/webp from the leading bytes of a base64 string; null if unsupported. */
export function sniffImageType(base64: string): FitCheckMediaType | null {
  const head = Buffer.from(base64.slice(0, 24), "base64");
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return "image/jpeg";
  }
  if (head.length >= 4 && head.readUInt32BE(0) === 0x89504e47) return "image/png";
  if (
    head.length >= 12 &&
    head.toString("ascii", 0, 4) === "RIFF" &&
    head.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}
