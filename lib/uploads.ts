import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"];

export async function saveUploadedFile(file: File, subdir: string) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Dosya boyutu 10 MB'ı aşamaz.");
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error("Desteklenmeyen dosya türü. İzin verilenler: PDF, JPG, PNG, WEBP, DOC, DOCX.");
  }

  const dir = path.join(UPLOADS_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const fileName = `${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, fileName), buffer);

  return fileName;
}

export function getUploadedFilePath(subdir: string, fileName: string) {
  return path.join(UPLOADS_ROOT, subdir, fileName);
}
