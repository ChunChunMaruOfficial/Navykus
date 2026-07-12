import type { ApplicationForm } from './types';

const env = (import.meta as any).env || {};
const API_BASE_URL = env.VITE_API_URL || (env.DEV ? 'http://localhost:4000' : '');

const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export interface ApplicationResponse {
  id: string;
  ticketId: string;
  status: 'confirmed' | 'pending';
}

export const submitApplication = async (
  form: ApplicationForm,
  source = 'modal',
): Promise<ApplicationResponse> => {
  const data = new FormData();

  Object.entries(form).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'projectFile' && value instanceof File) {
      data.append('projectFile', value);
      return;
    }
    if (key !== 'projectFile') {
      data.append(key, String(value));
    }
  });

  data.append('source', source);

  const response = await fetch(apiUrl('/api/applications'), {
    method: 'POST',
    body: data,
  });

  if (!response.ok) {
    throw new Error('Failed to submit application');
  }

  return response.json();
};

export const submitCommunityLead = async (payload: {
  name: string;
  age: string;
  location: string;
  contact: string;
  interest?: string;
}) => {
  const response = await fetch(apiUrl('/api/community-leads'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to submit community lead');
  }

  return response.json();
};
