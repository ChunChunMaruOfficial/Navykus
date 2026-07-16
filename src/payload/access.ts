import type { Access } from 'payload';

export const anyone: Access = () => true;

export const authenticated: Access = ({ req: { user } }) => Boolean(user);

type AccessUser = {
  id?: string | number;
  role?: 'user' | 'moderator' | 'admin' | null;
};

const getUser = (user: unknown): AccessUser | undefined => {
  if (!user || typeof user !== 'object') return undefined;
  return user as AccessUser;
};

export const isAdmin = (user: unknown) => getUser(user)?.role === 'admin';

export const isModerator = (user: unknown) => getUser(user)?.role === 'moderator';

export const adminOrModerator: Access = ({ req: { user } }) => isAdmin(user) || isModerator(user);

export const adminOnly: Access = ({ req: { user } }) => isAdmin(user);

export const ownUserOrAdmin: Access = ({ req: { user } }) => {
  const currentUser = getUser(user);
  if (!currentUser?.id) return false;
  if (currentUser.role === 'admin') return true;

  return {
    id: {
      equals: currentUser.id,
    },
  };
};

export const ownerOrStaff = (fieldName = 'user'): Access => ({ req: { user } }) => {
  const currentUser = getUser(user);
  if (!currentUser?.id) return false;
  if (currentUser.role === 'admin' || currentUser.role === 'moderator') return true;

  return {
    [fieldName]: {
      equals: currentUser.id,
    },
  };
};
