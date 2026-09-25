export interface FitProfile {
  heightCm: number;
  weightKg: number;
  usualSize: string;
  fitPreference: "fitted" | "regular" | "relaxed";
}

const KEY = "omardtf:fit-profile";

/** Reads the saved fit profile from this browser, if any. */
export function loadFitProfile(): FitProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FitProfile) : null;
  } catch {
    return null;
  }
}

export function saveFitProfile(profile: FitProfile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // private browsing / storage disabled — profile just won't persist
  }
}

export function clearFitProfile(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
