/** D1 rows are capped at 2 MB, so each stored file stays just below that. */
export const MAX_FILE_BYTES = 1_900_000;

const fileTypes = {
  'image/jpeg': { ext: 'jpg', magic: [0xff, 0xd8, 0xff] },
  'image/png': { ext: 'png', magic: [0x89, 0x50, 0x4e, 0x47] },
  'image/webp': { ext: 'webp', magic: [0x52, 0x49, 0x46, 0x46] },
  'application/pdf': { ext: 'pdf', magic: [0x25, 0x50, 0x44, 0x46] },
} as const;

export type StoredFileType = keyof typeof fileTypes;

export const FILE_ID_PATTERN = /^[a-f0-9]{32}\.(?:jpg|png|webp|pdf)$/;

export function isStoredFileType(value: string): value is StoredFileType {
  return value in fileTypes;
}

/** Trust the bytes, not the declared type: the header must match the format. */
export function matchesFileType(bytes: Uint8Array, type: StoredFileType) {
  const { magic } = fileTypes[type];
  if (bytes.length < 12 || !magic.every((byte, i) => bytes[i] === byte))
    return false;
  // RIFF is shared by several formats; WebP also carries "WEBP" at offset 8.
  if (type === 'image/webp')
    return String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return true;
}

/** Content-addressed name, so re-uploading the same file reuses one row. */
export async function fileIdFor(
  bytes: Uint8Array<ArrayBuffer>,
  type: StoredFileType,
) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const hex = Array.from(digest.slice(0, 16), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  return `${hex}.${fileTypes[type].ext}`;
}
