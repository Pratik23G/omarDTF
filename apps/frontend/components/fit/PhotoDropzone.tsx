"use client";

import { useState, type DragEvent } from "react";

/** Click, drop or camera-capture picker for a single photo. */
export default function PhotoDropzone({
  preview,
  onFile,
}: {
  preview: string | null;
  onFile: (file: File) => void;
}) {
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex aspect-[3/4] cursor-pointer flex-col items-center justify-center overflow-hidden border-2 border-dashed text-center transition ${
        dragging ? "border-black bg-stone-200" : "border-stone-300 bg-stone-100 hover:border-black"
      }`}
    >
      {preview ? (
        <img src={preview} alt="Your photo" className="h-full w-full object-cover" />
      ) : (
        <span className="px-4">
          <span className="block font-display text-lg font-semibold uppercase tracking-wide">
            Add your photo
          </span>
          <span className="mt-1 block text-sm text-stone-500">
            Drop it here, browse, or take one with your camera
          </span>
        </span>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
