// Read a File from <input type=file> and return it as a base64 data URL.
// Falls back to a friendly error if it's not an image or exceeds the cap.

export const MAX_IMAGE_BYTES = 600 * 1024; // ~600 KB raw — base64 grows by ~33%

export async function fileToDataUrl(
  file: File,
  opts: { maxBytes?: number } = {},
): Promise<string> {
  const maxBytes = opts.maxBytes ?? MAX_IMAGE_BYTES;
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar (jpg, png, webp, dst).');
  }
  if (file.size > maxBytes) {
    const kb = Math.round(maxBytes / 1024);
    throw new Error(`Ukuran gambar maks ${kb} KB. File ini ${Math.round(file.size / 1024)} KB.`);
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
