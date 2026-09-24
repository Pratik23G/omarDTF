/** OMARDTF logotype: heavy italic geometric caps with a gold "DTF". */
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wordmark font-display ${className}`}>
      OMAR<span className="wordmark-accent">DTF</span>
    </span>
  );
}
