// Upload of a file into the `media` collection from custom admin components
// (ImageUploadField, «Дерево медиа»).
//
// Payload 3 reads the non-file fields of a multipart request ONLY from a `_payload`
// JSON string. Plain form fields (`formData.append('alt', …)`) are silently dropped,
// so the required `alt` was missing and every upload failed with
// «The following field is invalid: Alt».

// Matches `client_max_body_size 20M` in the nginx config (DEPLOY.md / deploy.sh).
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

// Formats every browser can show. HEIC/HEIF from iPhones uploads fine but is a broken
// picture on the site, so it is rejected with a clear message instead.
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml';
const BROWSER_IMAGE_TYPES = new Set(IMAGE_ACCEPT.split(','));

export type UploadedMedia = { id: number | string; url?: string | null; filename?: string | null; mimeType?: string | null };

/** `/media/<filename>` with the name encoded: spaces, `#`, `%` or `?` in a file name must not break the URL. */
export const mediaFileUrl = (filename: string) => `/media/${encodeURIComponent(filename)}`;

const statusMessage = (status: number) => {
  if (status === 413) return 'Файл слишком большой для сервера. Уменьшите его (до 20 МБ) и попробуйте снова.';
  if (status === 401 || status === 403) return 'Сессия истекла или не хватает прав. Обновите страницу и войдите снова.';
  return `Загрузка не удалась (ошибка ${status}). Попробуйте ещё раз.`;
};

export const uploadMediaFile = async (
  file: File,
  data: Record<string, unknown>,
  headers: Record<string, string> = {},
  { imageOnly = false }: { imageOnly?: boolean } = {},
): Promise<UploadedMedia> => {
  if (imageOnly && ((file.type && !BROWSER_IMAGE_TYPES.has(file.type)) || /\.(heic|heif)$/i.test(file.name))) {
    throw new Error('Этот формат не открывается в браузере. Сохраните фото как JPG или PNG и загрузите снова.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Файл весит ${(file.size / 1024 / 1024).toFixed(1)} МБ, можно до 20 МБ. Уменьшите его и загрузите снова.`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('_payload', JSON.stringify(data));

  let res: Response;
  try {
    res = await fetch('/payload-api/media', { method: 'POST', credentials: 'include', headers, body: formData });
  } catch {
    throw new Error('Нет связи с сервером. Проверьте интернет и попробуйте снова.');
  }

  // nginx answers 413/502 with an HTML page, not JSON.
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const fieldError = json?.errors?.[0]?.data?.errors?.[0];
    const message = fieldError ? `${fieldError.label || fieldError.path}: ${fieldError.message}` : json?.errors?.[0]?.message || json?.message;
    throw new Error(message || statusMessage(res.status));
  }
  const uploaded = (json?.doc ?? json) as UploadedMedia | null;
  if (!uploaded?.id) throw new Error('Файл загружен, но сервер не вернул его номер. Обновите страницу.');
  return uploaded;
};
