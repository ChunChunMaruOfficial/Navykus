import type { Field } from 'payload';

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

