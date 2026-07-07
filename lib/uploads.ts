import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

export async function saveUploadedFile(file: File, subdir: string) {
  const dir = path.join(UPLOADS_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(file.name).slice(0, 10);
  const fileName = `${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, fileName), buffer);

  return fileName;
}

export function getUploadedFilePath(subdir: string, fileName: string) {
  return path.join(UPLOADS_ROOT, subdir, fileName);
}
