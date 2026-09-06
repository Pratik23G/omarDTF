"use client";

import { useState } from "react";

export default function DesignUploader() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label
        htmlFor="design-upload"
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center hover:border-gray-400"
      >
        {preview ? (
          <img
            src={preview}
            alt="Design preview"
            className="max-h-40 rounded-md object-contain"
          />
        ) : (
          <>
            <span className="font-medium">Upload your design</span>
            <span className="mt-1 text-sm text-gray-500">
              PNG, JPG, or SVG
            </span>
          </>
        )}
        <input
          id="design-upload"
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      {fileName && (
        <p className="mt-2 text-sm text-gray-500">Selected: {fileName}</p>
      )}
      <p className="mt-1 text-xs text-gray-400">
        Design upload is local preview only for now — saving to your order
        comes in a later step.
      </p>
    </div>
  );
}
