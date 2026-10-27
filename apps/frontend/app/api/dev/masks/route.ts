import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const FOLDERS: Record<string, string> = {
  masks: path.join("public", "masks"),
  hoodies: path.join("public", "products", "hoodies"),
  bases: path.join("public", "hoodie-bases"),
};

/** Dev-only: saves a hand-painted recolor mask, a generated hoodie photo or a hoodie base into public/. Disabled in production. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });

  const form = await request.formData();
  const name = String(form.get("name") ?? "");
  const folder = FOLDERS[String(form.get("folder") ?? "masks")];
  const file = form.get("file");
  const extension = String(form.get("ext") ?? "png");
  if (!folder || !["png", "jpg", "json"].includes(extension) || !/^[a-z0-9][a-z0-9._-]*$/i.test(name) || !(file instanceof File)) {
    return Response.json({ error: "Invalid upload" }, { status: 400 });
  }

  const directory = path.join(process.cwd(), folder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, `${name}.${extension}`), Buffer.from(await file.arrayBuffer()));
  return Response.json({ saved: path.join(folder, `${name}.${extension}`) });
}
