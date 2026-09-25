"use client";

import { useEffect, useRef, useState } from "react";
import type { FitCheckRequest, FitCheckResult, Product } from "@omardtf/shared-types";
import { requestFitCheck } from "@/lib/api";
import { clearFitProfile, loadFitProfile, saveFitProfile, type FitProfile } from "@/lib/fit-profile";
import { resizeToJpeg } from "@/lib/image-resize";
import { estimateSize } from "@/lib/size-estimate";
import FitResult from "./FitResult";
import PhotoDropzone from "./PhotoDropzone";

function estimateResult(profile: FitProfile, sizes: string[]): FitCheckResult {
  const { recommendedSize, alternateSize } = estimateSize(profile, sizes);
  return {
    usable: true,
    unusableReason: null,
    recommendedSize,
    alternateSize,
    fitSummary: "Estimated instantly from your saved measurements — no photo needed.",
    buildNote: "Want the precise AI-checked size instead? Run the full photo check below.",
    stylingTips: [],
    confidence: "low",
  };
}

type FitPreference = NonNullable<FitCheckRequest["fitPreference"]>;

const PREFERENCES: FitPreference[] = ["fitted", "regular", "relaxed"];
const FIELD = "w-full border border-stone-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none";

/** Dialog where a customer uploads a photo and gets an AI size recommendation for one product. */
export default function FitCheckModal({
  product,
  open,
  onClose,
  onUseSize,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
  onUseSize: (size: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [profile, setProfile] = useState<FitProfile | null>(() => loadFitProfile());
  const [photo, setPhoto] = useState<{ dataUrl: string; base64: string } | null>(null);
  const [feet, setFeet] = useState(() => (profile ? String(Math.floor(profile.heightCm / 2.54 / 12)) : ""));
  const [inches, setInches] = useState(() => (profile ? String(Math.round((profile.heightCm / 2.54) % 12)) : ""));
  const [pounds, setPounds] = useState(() => (profile ? String(Math.round(profile.weightKg / 0.4536)) : ""));
  const [usualSize, setUsualSize] = useState(profile?.usualSize ?? "");
  const [preference, setPreference] = useState<FitPreference>(profile?.fitPreference ?? "regular");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FitCheckResult | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function handleFile(file: File) {
    setError(null);
    try {
      setPhoto(await resizeToJpeg(file));
    } catch {
      setError("We couldn't read that image. Try a JPEG or PNG photo.");
    }
  }

  async function handleSubmit() {
    if (!photo) return;
    setLoading(true);
    setError(null);
    const totalInches = Number(feet) * 12 + Number(inches || 0);
    const heightCm = Number(feet) > 0 ? Math.round(totalInches * 2.54) : undefined;
    const weightKg = Number(pounds) > 0 ? Math.round(Number(pounds) * 0.4536) : undefined;
    try {
      const outcome = await requestFitCheck({
        productId: product.id,
        image: { data: photo.base64 },
        heightCm,
        weightKg,
        usualSize: usualSize || undefined,
        fitPreference: preference,
      });
      setResult(outcome);
      if (outcome.usable && heightCm && weightKg) {
        const next: FitProfile = { heightCm, weightKg, usualSize, fitPreference: preference };
        saveFitProfile(next);
        setProfile(next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fit check failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function useSavedProfile() {
    if (!profile) return;
    setResult(estimateResult(profile, product.sizes));
  }

  function forgetProfile() {
    clearFitProfile();
    setProfile(null);
  }

  function reset() {
    setResult(null);
    setPhoto(null);
    setError(null);
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className="m-auto w-[min(56rem,calc(100%-2rem))] max-h-[92vh] overflow-y-auto bg-white p-0 text-stone-900 backdrop:bg-black/70"
    >
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">AI Fit Check</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold italic uppercase tracking-tight">
              Try it on
            </h2>
            <p className="mt-1 text-sm text-stone-500">{product.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-stone-500 hover:text-black">
            &times;
          </button>
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,18rem)_1fr]">
          <PhotoDropzone preview={photo?.dataUrl ?? null} onFile={handleFile} />

          {result ? (
            <FitResult result={result} onUseSize={(size) => { onUseSize(size); onClose(); }} onRetry={reset} />
          ) : (
            <div className="space-y-4">
              {profile && (
                <div className="flex items-center justify-between gap-3 border border-accent/30 bg-accent/5 px-3 py-2.5">
                  <p className="text-sm text-stone-700">
                    We remember your measurements from last time.
                  </p>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={useSavedProfile}
                      className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-accent"
                    >
                      Instant size
                    </button>
                    <button
                      onClick={forgetProfile}
                      className="text-xs font-semibold uppercase tracking-wide text-stone-400 hover:text-stone-700"
                    >
                      Forget
                    </button>
                  </div>
                </div>
              )}
              <p className="text-sm text-stone-600">
                Use a full-length photo facing the camera in good light, with just you in frame.
                Add measurements for a sharper recommendation.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Height (ft)
                  <input value={feet} onChange={(e) => setFeet(e.target.value)} inputMode="numeric" placeholder="5" className={`${FIELD} mt-1`} />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  (in)
                  <input value={inches} onChange={(e) => setInches(e.target.value)} inputMode="numeric" placeholder="10" className={`${FIELD} mt-1`} />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Weight (lb)
                  <input value={pounds} onChange={(e) => setPounds(e.target.value)} inputMode="numeric" placeholder="170" className={`${FIELD} mt-1`} />
                </label>
              </div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Usual size
                <select value={usualSize} onChange={(e) => setUsualSize(e.target.value)} className={`${FIELD} mt-1`}>
                  <option value="">Not sure</option>
                  {product.sizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-wide text-stone-500">Preferred fit</legend>
                <div className="mt-1 flex gap-2">
                  {PREFERENCES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPreference(p)}
                      className={`flex-1 border px-3 py-2 text-sm font-medium capitalize transition ${
                        preference === p ? "border-black bg-black text-white" : "border-stone-300 hover:border-black"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </fieldset>
              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              {loading && (
                <p className="text-xs text-stone-500">This can take up to a minute on the first photo.</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={!photo || loading}
                className="w-full rounded-full bg-black px-4 py-3 font-semibold uppercase tracking-wide text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Analysing your fit…" : "Check my fit"}
              </button>
              <p className="text-xs text-stone-400">
                Your photo is sent to our AI service to make this recommendation. We don&apos;t save it.
              </p>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
