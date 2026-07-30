import type { CollectionBeforeChangeHook, Field } from 'payload';

export const legacyIdField: Field = {
  name: 'legacyId',
  type: 'text',
  admin: {
    description: 'Stable ID from the original frontend data file.',
    position: 'sidebar',
  },
  index: true,
};

export const sortOrderField: Field = {
  name: 'sortOrder',
  type: 'number',
  defaultValue: 0,
  admin: {
    position: 'sidebar',
  },
};

export const publishedField: Field = {
  name: 'isPublished',
  type: 'checkbox',
  defaultValue: true,
  admin: {
    position: 'sidebar',
  },
};

export const textListField = (name: string, label: string): Field => ({
  name,
  label,
  type: 'array',
  fields: [
    {
      name: 'value',
      type: 'text',
      required: true,
    },
  ],
});

export const newlineListField = (name: string, label: string): Field => ({
  name,
  label,
  type: 'textarea',
  admin: {
    description: 'One item per line.',
  },
});

export const seoFields: Field[] = [
  {
    name: 'seoTitle',
    label: 'SEO title',
    type: 'text',
    maxLength: 80,
  },
  {
    name: 'seoDescription',
    label: 'SEO description',
    type: 'textarea',
    maxLength: 180,
  },
];

export const publicContentVersions = {
  drafts: true,
  maxPerDoc: 25,
} as const;

type PublicationRecord = Record<string, unknown>;

const hasOwn = (record: PublicationRecord, key: string) =>
  Object.prototype.hasOwnProperty.call(record, key);

const booleanValue = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'published', 'approved'].includes(normalized)) return true;
    if (['false', '0', 'no', 'draft', 'rejected'].includes(normalized)) return false;
  }
  return undefined;
};

const statusValue = (value: unknown) =>
  typeof value === 'string' ? value.trim() : undefined;

export const syncPublishedDraftData = (
  data: PublicationRecord,
  originalDoc?: PublicationRecord,
) => {
  const hasDraftStatus = hasOwn(data, '_status');
  const hasPublishedFlag = hasOwn(data, 'isPublished');
  if (!hasDraftStatus && !hasPublishedFlag) return data;

  const draftStatus = statusValue(data._status);
  const publishedFlag = booleanValue(data.isPublished);
  const originalDraftStatus = statusValue(originalDoc?._status);
  const originalPublishedFlag = booleanValue(originalDoc?.isPublished);
  const draftChanged = hasDraftStatus && (!originalDoc || draftStatus !== originalDraftStatus);
  const publishedChanged = hasPublishedFlag && (!originalDoc || publishedFlag !== originalPublishedFlag);
  const shouldPublish = draftChanged && !publishedChanged
    ? draftStatus === 'published'
    : publishedChanged && !draftChanged
      ? publishedFlag === true
      : draftStatus === 'draft' || publishedFlag === false
        ? false
        : draftStatus === 'published' || publishedFlag === true
          ? true
          : undefined;

  if (shouldPublish === undefined) return data;
  data._status = shouldPublish ? 'published' : 'draft';
  data.isPublished = shouldPublish;
  return data;
};

export const syncTeamMemberPublicationData = (
  data: PublicationRecord,
  originalDoc?: PublicationRecord,
) => {
  const hasDraftStatus = hasOwn(data, '_status');
  const hasApprovedFlag = hasOwn(data, 'isApproved');
  const hasModerationStatus = hasOwn(data, 'moderationStatus');
  if (!hasDraftStatus && !hasApprovedFlag && !hasModerationStatus) return data;

  const draftStatus = statusValue(data._status) ?? statusValue(originalDoc?._status);
  const moderationStatus = statusValue(data.moderationStatus) ?? statusValue(originalDoc?.moderationStatus);
  const rawApprovedFlag = hasApprovedFlag
    ? booleanValue(data.isApproved)
    : booleanValue(originalDoc?.isApproved);
  const originalDraftStatus = statusValue(originalDoc?._status);
  const originalModerationStatus = statusValue(originalDoc?.moderationStatus);
  const originalApprovedFlag = booleanValue(originalDoc?.isApproved);
  const draftChanged = hasDraftStatus && (!originalDoc || draftStatus !== originalDraftStatus);
  const moderationChanged = hasModerationStatus && (!originalDoc || moderationStatus !== originalModerationStatus);
  const approvedChanged = hasApprovedFlag && (!originalDoc || rawApprovedFlag !== originalApprovedFlag);

  if (moderationChanged) {
    data.isApproved = moderationStatus === 'approved';
    if (moderationStatus !== 'approved') data._status = 'draft';
  }
  if (approvedChanged) {
    if (rawApprovedFlag) {
      if (!hasModerationStatus) data.moderationStatus = 'approved';
    } else {
      data._status = 'draft';
    }
  }

  const effectiveModerationStatus = statusValue(data.moderationStatus) ?? moderationStatus;
  const effectiveApproved = effectiveModerationStatus
    ? effectiveModerationStatus === 'approved'
    : booleanValue(data.isApproved) ?? rawApprovedFlag;

  if (draftChanged) {
    data._status = draftStatus === 'published' && effectiveApproved ? 'published' : 'draft';
  } else if ((moderationChanged || approvedChanged) && effectiveApproved === false) {
    data._status = 'draft';
  }
  return data;
};

export const syncBlogPublicationData = (
  data: PublicationRecord,
  originalDoc?: PublicationRecord,
) => {
  const hasStatus = hasOwn(data, 'status');
  const hasDraftStatus = hasOwn(data, '_status');
  const hasPublishedFlag = hasOwn(data, 'isPublished');
  if (!hasStatus && !hasDraftStatus && !hasPublishedFlag) return data;

  const originalStatus = statusValue(originalDoc?.status) || 'draft';
  let nextStatus = statusValue(data.status) || originalStatus;
  const statusChanged = hasStatus && (!originalDoc || nextStatus !== originalStatus);
  const draftStatus = statusValue(data._status);
  const publishedFlag = booleanValue(data.isPublished);
  const originalDraftStatus = statusValue(originalDoc?._status);
  const originalPublishedFlag = booleanValue(originalDoc?.isPublished);
  const draftChanged = hasDraftStatus && (!originalDoc || draftStatus !== originalDraftStatus);
  const publishedChanged = hasPublishedFlag && (!originalDoc || publishedFlag !== originalPublishedFlag);
  const flagsRequestHidden = draftChanged && draftStatus === 'draft' || publishedChanged && publishedFlag === false;
  const flagsRequestPublished = draftChanged && draftStatus === 'published' || publishedChanged && publishedFlag === true;

  if (!statusChanged && flagsRequestHidden && nextStatus === 'published') {
    nextStatus = 'draft';
  } else if (!statusChanged && flagsRequestPublished) {
    nextStatus = 'published';
  }

  const shouldPublish = nextStatus === 'published' && !flagsRequestHidden;
  if (hasStatus || hasDraftStatus || hasPublishedFlag) data.status = shouldPublish ? 'published' : nextStatus === 'published' ? 'draft' : nextStatus;
  data._status = shouldPublish ? 'published' : 'draft';
  data.isPublished = shouldPublish;
  data.isApproved = data.status === 'approved' || data.status === 'published';
  if (shouldPublish && !data.publishedAt && !originalDoc?.publishedAt) {
    data.publishedAt = new Date().toISOString();
  }
  return data;
};

export const syncPublishedDraftBeforeChange: CollectionBeforeChangeHook = ({ data, originalDoc }) =>
  syncPublishedDraftData(data as PublicationRecord, originalDoc as PublicationRecord | undefined);

export const syncTeamMemberPublicationBeforeChange: CollectionBeforeChangeHook = ({ data, originalDoc }) =>
  syncTeamMemberPublicationData(data as PublicationRecord, originalDoc as PublicationRecord | undefined);

export const syncBlogPublicationBeforeChange: CollectionBeforeChangeHook = ({ data, originalDoc }) =>
  syncBlogPublicationData(data as PublicationRecord, originalDoc as PublicationRecord | undefined);

