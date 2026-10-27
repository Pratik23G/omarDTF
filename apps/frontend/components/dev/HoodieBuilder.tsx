"use client";

import { useEffect, useRef, useState } from "react";
import { blankHoodie, composeHoodie, isBackPrint } from "@/lib/hoodie-compose";
import { loadHoodieBase, prepareBackBase, prepareFrontBase, type PreparedBase } from "@/lib/hoodie-base";
import { exportMaskBlob } from "@/lib/mask-painter";

type Design = { id: string; name: string; description: string; image: string };
type Built = { slug: string; name: string; image: HTMLCanvasElement; mask: HTMLCanvasElement; color: string; view: string };

/** "viking-voyage-tee" / "spongebob-truckbed-tee-green" -> "viking-voyage-hoodie". */
export const hoodieSlug = (image: string) => (image.split("/").pop() ?? "").replace(/\.[^.]+$/, "").replace(/-tee.*$/, "") + "-hoodie";

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

async function upload(folder: "hoodies" | "masks" | "bases", name: string, blob: Blob, ext: "png" | "jpg" | "json") {
  const form = new FormData();
  form.set("folder", folder);
  form.set("name", name);
  form.set("ext", ext);
  form.set("file", blob, `${name}.${ext}`);
  const response = await fetch("/api/dev/masks", { method: "POST", body: form });
  if (!response.ok) throw new Error(`Save failed for ${name}`);
}

/** Dev tool: previews a hoodie for every tee design, then saves photos + recolor masks into public/. */
export default function HoodieBuilder({ designs }: { designs: Design[] }) {
  const [built, setBuilt] = useState<Built[]>([]);
  const [status, setStatus] = useState("Building…");
  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results: Built[] = [];
      const blank = await blankHoodie("#16171a");
      results.push({ slug: "custom-hoodie", name: "Custom Hoodie (blank)", image: blank.image, mask: blank.fabricMask, color: blank.color, view: "front" });
      for (const design of designs) {
        const view = isBackPrint(design) ? "back" : "front";
        const hoodie = await composeHoodie(design.image, view);
        if (hoodie) results.push({ slug: hoodieSlug(design.image), name: design.name, image: hoodie.image, mask: hoodie.fabricMask, color: hoodie.color, view });
        else console.warn("No printed design found in", design.image);
      }
      if (cancelled) return;
      setBuilt(results);
      setStatus(`Built ${results.length} hoodies. Check them, then save.`);
    })().catch((error) => setStatus(`Failed: ${error instanceof Error ? error.message : error}`));
    return () => {
      cancelled = true;
    };
  }, [designs]);

  async function saveBase(view: "front" | "back", base: PreparedBase) {
    await upload("bases", `${view}-blank`, (await toBlob(base.blank, "image/jpeg", 0.92)) as Blob, "jpg");
    await upload("bases", `${view}-mask`, (await toBlob(base.mask, "image/png")) as Blob, "png");
    await upload("bases", `${view}-cords`, (await toBlob(base.cords, "image/png")) as Blob, "png");
    await upload("bases", view, new Blob([JSON.stringify(base.meta)], { type: "application/json" }), "json");
  }

  async function prepareBase() {
    setStatus("Preparing base from reference…");
    const image = new Image();
    image.src = "/hoodie-bases/_reference.png";
    await image.decode();
    const base: PreparedBase = prepareFrontBase(image);
    await saveBase("front", base);
    setStatus("Front base saved. Saving back base…");
    const saved = await loadHoodieBase("front");
    if (!saved) throw new Error("Couldn't reload the front base");
    await saveBase("back", prepareBackBase(saved));
    setStatus("Front and back bases saved to public/hoodie-bases. Reload this page to rebuild the hoodies on them.");
  }

  async function saveAll() {
    setStatus("Saving…");
    for (const item of built) {
      const photo = await toBlob(item.image, "image/jpeg", 0.88);
      const mask = await exportMaskBlob(item.mask);
      if (!photo || !mask) throw new Error("Export failed");
      await upload("hoodies", item.slug, photo, "jpg");
      await upload("masks", item.slug, mask, "png");
    }
    setStatus(`Saved ${built.length} hoodies to public/products/hoodies and masks to public/masks.`);
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-3">
        <button className="min-h-10 rounded bg-black px-4 text-sm font-medium text-white disabled:opacity-40" disabled={built.length === 0} onClick={() => saveAll().catch((e) => setStatus(String(e)))}>
          Save all hoodies + masks
        </button>
        <p className="text-sm text-stone-600" data-testid="status">{status}</p>
      </div>
      <button className="min-h-10 rounded border border-stone-400 px-4 text-sm font-medium" onClick={() => prepareBase().catch((e) => setStatus(String(e)))}>
        Prepare front base from reference photo
      </button>
      <div ref={grid} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {built.map((item) => (
          <figure key={item.slug}>
            <canvas
              className="w-full border border-stone-300"
              ref={(canvas) => {
                if (!canvas) return;
                canvas.width = item.image.width;
                canvas.height = item.image.height;
                canvas.getContext("2d")?.drawImage(item.image, 0, 0);
              }}
            />
            <figcaption className="mt-1 text-xs text-stone-600">{item.name} · {item.view} · {item.color}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
