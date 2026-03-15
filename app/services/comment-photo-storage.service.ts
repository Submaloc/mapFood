import { randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

const DEFAULT_UPLOADS_DIR = path.resolve(process.cwd(), "storage");
const COMMENT_PHOTOS_DIR = "comments";

export const MAX_COMMENT_PHOTO_COUNT = 3;
export const MAX_COMMENT_PHOTO_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export type StoredCommentPhoto = {
  filePath: string;
  fileName: string;
  mimeType: string;
  size: number;
};

function getUploadsDir() {
  return process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : DEFAULT_UPLOADS_DIR;
}

function getCommentPhotoDir() {
  return path.join(getUploadsDir(), COMMENT_PHOTOS_DIR);
}

function getRelativeCommentPhotoPath(fileName: string) {
  return `${COMMENT_PHOTOS_DIR}/${fileName}`;
}

function getAbsoluteCommentPhotoPath(filePath: string) {
  return path.join(getUploadsDir(), filePath);
}

function getFileExtension(file: File) {
  const byMimeType = EXTENSION_BY_MIME_TYPE[file.type];
  if (byMimeType) return byMimeType;

  const originalExtension = path.extname(file.name || "").toLowerCase();
  return originalExtension || ".bin";
}

export function validateCommentPhotoFiles(files: File[]) {
  if (files.length > MAX_COMMENT_PHOTO_COUNT) {
    throw new Error(
      `Можно прикрепить не более ${MAX_COMMENT_PHOTO_COUNT} фото.`
    );
  }

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error("Разрешены только JPG, PNG и WEBP.");
    }

    if (file.size > MAX_COMMENT_PHOTO_SIZE) {
      throw new Error("Размер одного фото не должен превышать 5 МБ.");
    }
  }
}

export async function saveCommentPhotoFiles(
  files: File[]
): Promise<StoredCommentPhoto[]> {
  if (files.length === 0) return [];

  validateCommentPhotoFiles(files);

  const targetDir = getCommentPhotoDir();
  await mkdir(targetDir, { recursive: true });

  const savedPhotos: StoredCommentPhoto[] = [];

  try {
    for (const file of files) {
      const fileName = `${randomUUID()}${getFileExtension(file)}`;
      const filePath = getRelativeCommentPhotoPath(fileName);
      const absolutePath = getAbsoluteCommentPhotoPath(filePath);
      const buffer = Buffer.from(await file.arrayBuffer());

      await writeFile(absolutePath, buffer);

      savedPhotos.push({
        filePath,
        fileName: file.name || fileName,
        mimeType: file.type,
        size: file.size,
      });
    }

    return savedPhotos;
  } catch (error) {
    await deleteStoredCommentPhotoFiles(savedPhotos.map((photo) => photo.filePath));
    throw error;
  }
}

export async function deleteStoredCommentPhotoFiles(filePaths: string[]) {
  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        await rm(getAbsoluteCommentPhotoPath(filePath), { force: true });
      } catch {
        // Ignore missing files during cleanup.
      }
    })
  );
}

export async function readStoredCommentPhoto(filePath: string) {
  const absolutePath = getAbsoluteCommentPhotoPath(filePath);
  return readFile(absolutePath);
}

