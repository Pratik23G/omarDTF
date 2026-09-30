"use client";

/** Product photo, swapped to match the selected color when a same-index photo exists for it. */
export default function ProductGallery({
  images,
  colors,
  selectedColor,
  name,
}: {
  images: string[];
  colors: string[];
  selectedColor: string;
  name: string;
}) {
  const colorIndex = colors.indexOf(selectedColor);
  const image = images[colorIndex] ?? images[0];

  return (
    <div className="border border-stone-300 bg-stone-900 p-6">
      <img key={image} src={image} alt={`${name} in ${selectedColor}`} className="aspect-square w-full object-cover" />
    </div>
  );
}
