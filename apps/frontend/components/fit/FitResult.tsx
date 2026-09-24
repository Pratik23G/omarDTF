import type { FitCheckResult } from "@omardtf/shared-types";

const CONFIDENCE_LABEL = { low: "Low confidence", medium: "Medium confidence", high: "High confidence" };

/** Presents the AI recommendation, or the reason the photo couldn't be used. */
export default function FitResult({
  result,
  onUseSize,
  onRetry,
}: {
  result: FitCheckResult;
  onUseSize: (size: string) => void;
  onRetry: () => void;
}) {
  if (!result.usable || !result.recommendedSize) {
    return (
      <div className="space-y-4">
        <p className="font-display text-lg font-semibold uppercase">We couldn&apos;t read that photo</p>
        <p className="text-stone-600">
          {result.unusableReason ?? "Try a clearer, well-lit photo with your whole body in frame."}
        </p>
        <button onClick={onRetry} className="rounded-full border border-black px-5 py-2 text-sm font-semibold uppercase tracking-wide hover:bg-black hover:text-white">
          Try another photo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end gap-4">
        <span className="flex h-20 min-w-20 items-center justify-center bg-black px-4 font-display text-4xl font-extrabold italic text-white">
          {result.recommendedSize}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Recommended size</p>
          <p className="text-sm text-stone-500">
            {CONFIDENCE_LABEL[result.confidence]}
            {result.alternateSize && ` · or ${result.alternateSize} for a different fit`}
          </p>
        </div>
      </div>
      <p className="text-stone-700">{result.fitSummary}</p>
      {result.buildNote && <p className="text-sm text-stone-500">{result.buildNote}</p>}
      {result.stylingTips.length > 0 && (
        <ul className="space-y-1.5 border-t border-stone-200 pt-4 text-sm text-stone-700">
          {result.stylingTips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="text-accent">&#9670;</span>
              {tip}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-3 pt-1">
        <button
          onClick={() => onUseSize(result.recommendedSize!)}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-accent"
        >
          Use size {result.recommendedSize}
        </button>
        <button onClick={onRetry} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide hover:border-black">
          Try another photo
        </button>
      </div>
      <p className="text-xs text-stone-400">AI estimate from one photo, not a guarantee of fit.</p>
    </div>
  );
}
