"use client";

import { useEffect } from "react";
import { InstagramIcon } from "@/components/icons";
import { REEL_URLS } from "@/lib/instagram-reels";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const EMBED_SCRIPT_ID = "instagram-embed-script";

/**
 * Loads Instagram's own embed.js and re-processes it whenever this section mounts,
 * so navigating back to the homepage re-renders the blockquotes into real embeds.
 */
function useInstagramEmbedScript() {
  useEffect(() => {
    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }
    if (document.getElementById(EMBED_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = EMBED_SCRIPT_ID;
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => window.instgrm?.Embeds.process();
    document.body.appendChild(script);
  }, []);
}

/** Homepage strip of real Instagram reels via Instagram's official embed widget — no scraping, no API key. */
export default function InstagramFeed() {
  useInstagramEmbedScript();

  if (REEL_URLS.length === 0) return null;

  return (
    <section data-header-theme="dark" className="bg-carbon py-16 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="gold-text font-display text-sm font-semibold uppercase tracking-[0.3em]">
              @omardtfca
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold italic uppercase tracking-tight sm:text-4xl">
              From the Shop Floor
            </h2>
          </div>
          <a
            href="https://www.instagram.com/omardtfca/"
            target="_blank"
            rel="noopener noreferrer"
            className="ghost-btn inline-flex shrink-0 items-center gap-2 font-display text-[13px] font-semibold uppercase tracking-[0.16em]"
          >
            <InstagramIcon className="h-4 w-4" />
            Follow on Instagram
          </a>
        </div>

        <ul className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
          {REEL_URLS.map((url) => (
            <li key={url} className="w-[80%] shrink-0 snap-start sm:w-[45%] lg:w-[23%]">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={url}
                data-instgrm-version="14"
                style={{ margin: 0, width: "100%" }}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
