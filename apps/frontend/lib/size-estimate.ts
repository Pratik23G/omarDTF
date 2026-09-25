import type { FitProfile } from "./fit-profile";

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

const WEIGHT_BANDS_KG: { max: number; size: string }[] = [
  { max: 50, size: "XXS" },
  { max: 58, size: "XS" },
  { max: 68, size: "S" },
  { max: 80, size: "M" },
  { max: 93, size: "L" },
  { max: 107, size: "XL" },
  { max: 122, size: "2XL" },
  { max: Infinity, size: "3XL" },
];

function baseSize(heightCm: number, weightKg: number): string {
  const band = WEIGHT_BANDS_KG.find((b) => weightKg <= b.max) ?? WEIGHT_BANDS_KG[WEIGHT_BANDS_KG.length - 1];
  let idx = SIZE_ORDER.indexOf(band.size);
  if (heightCm >= 188) idx += 1;
  if (heightCm <= 160) idx -= 1;
  return SIZE_ORDER[Math.max(0, Math.min(SIZE_ORDER.length - 1, idx))];
}

/** Rough, no-AI size guess from saved height/weight/fit preference, clamped to what the product actually offers. */
export function estimateSize(
  profile: FitProfile,
  availableSizes: string[],
): { recommendedSize: string; alternateSize: string | null } {
  const offeredIdx = availableSizes
    .map((s) => SIZE_ORDER.indexOf(s))
    .filter((i) => i !== -1)
    .sort((a, b) => a - b);
  if (offeredIdx.length === 0) return { recommendedSize: availableSizes[0], alternateSize: null };

  let idx = SIZE_ORDER.indexOf(baseSize(profile.heightCm, profile.weightKg));
  if (profile.fitPreference === "fitted") idx -= 1;
  if (profile.fitPreference === "relaxed") idx += 1;

  const min = offeredIdx[0];
  const max = offeredIdx[offeredIdx.length - 1];
  idx = Math.max(min, Math.min(max, idx));

  const recommendedSize = SIZE_ORDER[idx];
  const altIdx = idx + 1 <= max ? idx + 1 : idx - 1 >= min ? idx - 1 : -1;
  const alternateSize = altIdx >= 0 && altIdx !== idx ? SIZE_ORDER[altIdx] : null;

  return { recommendedSize, alternateSize };
}
