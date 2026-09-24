const LAYERS = [
  { name: "Artwork", width: "w-4/5" },
  { name: "Text", width: "w-2/5" },
  { name: "Backdrop", width: "w-3/5" },
];

const SWATCHES = ["#111315", "#3a3d42", "#e8e8e8", "#7b848f", "#5c2a24"];

/** Miniature configurator panel that slides out of a garment pane on hover. */
export default function DesignerPanel() {
  return (
    <div
      aria-hidden
      className="designer-panel space-y-2 p-2 font-display text-[9px] font-medium uppercase tracking-[0.14em] text-gunmetal-100"
    >
      <div className="flex items-center justify-between text-gold-light">
        <span>Design Studio</span>
        <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_6px_#d4af37]" />
      </div>
      <ul className="space-y-1">
        {LAYERS.map((layer, i) => (
          <li key={layer.name} className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-gold" : "bg-gunmetal-500"}`}
            />
            <span className="w-11 shrink-0">{layer.name}</span>
            <span className="h-[3px] flex-1 bg-gunmetal-700">
              <span className={`block h-full bg-gunmetal-300 ${layer.width}`} />
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-gunmetal-700 pt-1.5">
        <span>Print area</span>
        <span className="text-gunmetal-100">11 × 13 in</span>
      </div>
      <div className="flex gap-1.5">
        {SWATCHES.map((color, i) => (
          <span
            key={color}
            style={{ backgroundColor: color }}
            className={`h-3 w-3 rounded-full border ${
              i === 0 ? "border-gold ring-1 ring-gold/60" : "border-gunmetal-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
