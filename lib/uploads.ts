import type { PortfolioData } from "./portfolio.ts";

export const MAX_UPLOAD_BYTES = 1_900_000;

export type UploadFn = (file: Blob) => Promise<string>;

/** Send one file to the owner-only upload endpoint and return its URL. */
export async function uploadFile(file: Blob, csrfToken: string) {
  const response = await fetch("/api/files", {
    method: "POST",
    body: file,
    headers: {
      "Content-Type": file.type,
      ...(csrfToken ? { "x-portfolio-csrf": csrfToken } : {}),
    },
  });
  let result: { url?: string; error?: string } = {};
  try {
    result = (await response.json()) as typeof result;
  } catch {
    // Non-JSON error page.
  }
  if (!response.ok || !result.url)
    throw new Error(result.error || `Upload failed (${response.status}).`);
  return result.url;
}

/** Shrink an image to a sensible display size and re-encode it as JPEG. */
export function compressImage(file: File, maxDim = 1400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error("Image is larger than 15 MB."));
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      reject(new Error("Choose a JPEG, PNG, or WebP image."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The selected image is invalid."));
    };
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Image processing is unavailable in this browser."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) reject(new Error("Failed to process the image."));
          else if (blob.size > MAX_UPLOAD_BYTES)
            reject(new Error("The compressed image is still too large."));
          else resolve(blob);
        },
        "image/jpeg",
        0.85,
      );
    };
    img.src = url;
  });
}

/**
 * Older saves embedded uploads as data: URLs inside the content record.
 * Move each into file storage so the record stays small.
 */
export async function moveInlineFiles(
  data: PortfolioData,
  upload: UploadFn,
): Promise<PortfolioData> {
  const cache = new Map<string, Promise<string>>();
  const move = async (value: string | undefined) => {
    if (!value?.startsWith("data:")) return value;
    if (!cache.has(value))
      cache.set(
        value,
        fetch(value)
          .then((response) => response.blob())
          .then(upload),
      );
    return cache.get(value)!;
  };
  return {
    ...data,
    hero: { ...data.hero, photoUrl: (await move(data.hero.photoUrl)) ?? "" },
    resumeUrl: (await move(data.resumeUrl)) ?? "",
    projects: await Promise.all(
      data.projects.map(async (project) => ({
        ...project,
        imageUrl: await move(project.imageUrl),
      })),
    ),
    certifications: data.certifications
      ? await Promise.all(
          data.certifications.map(async (cert) => ({
            ...cert,
            badgeUrl: await move(cert.badgeUrl),
          })),
        )
      : undefined,
    testimonials: data.testimonials
      ? await Promise.all(
          data.testimonials.map(async (item) => ({
            ...item,
            avatarUrl: await move(item.avatarUrl),
          })),
        )
      : undefined,
  };
}
