'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { FieldDescription, FieldLabel, useAuth, useField } from '@payloadcms/ui';

import { IMAGE_ACCEPT, mediaFileUrl, uploadMediaFile, type UploadedMedia as MediaDoc } from '../uploadMedia';

type Props = {
  path: string;
  readOnly?: boolean;
  field: {
    name: string;
    label?: unknown;
    required?: boolean;
    admin?: { description?: unknown };
  };
};

const mediaId = (value: unknown): string | number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object') {
    const record = value as { id?: unknown; value?: unknown };
    return (record.id ?? record.value ?? null) as string | number | null;
  }
  return value as string | number;
};

const mediaUrl = (doc: MediaDoc | null) => (doc ? doc.url || (doc.filename ? mediaFileUrl(doc.filename) : null) : null);

/**
 * Replacement for Payload's upload field: the only way to set a picture is to pick a file
 * from the computer (no «Создать новый» drawer and no «Выбрать из существующих» list).
 * The file is uploaded to `media` right away and the field stores its id.
 */
export const ImageUploadField = ({ path, field, readOnly }: Props) => {
  const { token } = useAuth();
  const { value, setValue, showError, errorMessage } = useField<unknown>({ potentiallyStalePath: path });
  const [doc, setDoc] = useState<MediaDoc | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const id = mediaId(value);
  const authHeaders = useMemo<Record<string, string>>(() => (token ? { Authorization: `JWT ${token}` } : {}), [token]);

  useEffect(() => {
    if (id === null) {
      setDoc(null);
      return;
    }
    if (value && typeof value === 'object' && ('url' in (value as object) || 'filename' in (value as object))) {
      setDoc(value as MediaDoc);
      return;
    }
    let cancelled = false;
    fetch(`/payload-api/media/${encodeURIComponent(String(id))}?depth=0`, { credentials: 'include', headers: authHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { if (!cancelled) setDoc(json as MediaDoc | null); })
      .catch(() => { if (!cancelled) setDoc(null); });
    return () => { cancelled = true; };
  }, [authHeaders, id, value]);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const alt = typeof field.label === 'string' && field.label.trim() ? field.label : file.name;
      const uploaded = await uploadMediaFile(file, { alt }, authHeaders, { imageOnly: true });
      setDoc(uploaded);
      setValue(uploaded.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const preview = mediaUrl(doc);
  const isImage = !doc?.mimeType || doc.mimeType.startsWith('image/');
  const button: React.CSSProperties = {
    fontSize: 13,
    padding: '6px 14px',
    borderRadius: 4,
    border: '1px solid var(--theme-elevation-250)',
    background: 'var(--theme-elevation-100)',
    color: 'var(--theme-text)',
    cursor: busy || readOnly ? 'default' : 'pointer',
  };

  return (
    <div className="field-type" style={{ marginBottom: 'var(--spacing-field, 24px)' }}>
      <FieldLabel label={field.label as never} path={path} required={field.required} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {preview && isImage ? (
          <img
            src={preview}
            alt=""
            style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--theme-elevation-150)', background: 'var(--theme-elevation-50)' }}
          />
        ) : id !== null ? (
          <span style={{ fontSize: 13 }}>{doc?.filename || 'Файл загружен'}</span>
        ) : null}
        <input
          ref={input}
          type="file"
          accept={IMAGE_ACCEPT}
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = '';
          }}
        />
        <button type="button" style={button} disabled={busy || readOnly} onClick={() => input.current?.click()}>
          {busy ? 'Загрузка…' : id !== null ? 'Заменить фото' : 'Загрузить фото'}
        </button>
        {id !== null && !readOnly && (
          <button type="button" style={{ ...button, color: 'var(--theme-error-500)' }} disabled={busy} onClick={() => { setValue(null); setDoc(null); }}>
            Убрать
          </button>
        )}
      </div>
      {(error || (showError && errorMessage)) && (
        <div style={{ color: 'var(--theme-error-500)', fontSize: 13, marginTop: 6 }}>{error || errorMessage}</div>
      )}
      <FieldDescription description={field.admin?.description as never} path={path} />
    </div>
  );
};

export default ImageUploadField;
