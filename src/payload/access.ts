import type { Access } from 'payload';
import { isAllowedAdminEmail, isAllowedAdminId } from '../security/admin-auth';

export const anyone: Access = () => true;

export const authenticated: Access = ({ req: { user } }) => Boolean(user);

type AccessUser = {
  id?: string | number;
  email?: string | null;
  role?: 'user' | 'moderator' | 'admin' | null;
};

const getUser = (user: unknown): AccessUser | undefined => {
  if (!user || typeof user !== 'object') return undefined;
  return user as AccessUser;
};

export const isAdmin = (user: unknown) => {
  const currentUser = getUser(user);
  return currentUser?.role === 'admin'
    || isAllowedAdminEmail(currentUser?.email)
    || isAllowedAdminId(currentUser?.id);
};

export const isModerator = (user: unknown) => getUser(user)?.role === 'moderator';

export const adminOrModerator: Access = ({ req: { user } }) => isAdmin(user) || isModerator(user);

export const adminOnly: Access = ({ req: { user } }) => isAdmin(user);

export const ownUserOrAdmin: Access = ({ req: { user } }) => {
  const currentUser = getUser(user);
  if (!currentUser?.id) return false;
  if (isAdmin(currentUser)) return true;

  return {
    id: {
      equals: currentUser.id,
    },
  };
};

export const ownerOrStaff = (fieldName = 'user'): Access => ({ req: { user } }) => {
  const currentUser = getUser(user);
  if (!currentUser?.id) return false;
  if (isAdmin(currentUser) || currentUser.role === 'moderator') return true;

  return {
    [fieldName]: {
      equals: currentUser.id,
    },
  };
};
