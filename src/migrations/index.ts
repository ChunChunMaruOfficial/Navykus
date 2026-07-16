import * as migration_20260714_165539_add_user_roles from './20260714_165539_add_user_roles';
import * as migration_20260714_223245_add_platform_indexes from './20260714_223245_add_platform_indexes';
import * as migration_20260715_120000_add_user_avatar_profile from './20260715_120000_add_user_avatar_profile';

export const migrations = [
  {
    up: migration_20260714_165539_add_user_roles.up,
    down: migration_20260714_165539_add_user_roles.down,
    name: '20260714_165539_add_user_roles'
  },
  {
    up: migration_20260714_223245_add_platform_indexes.up,
    down: migration_20260714_223245_add_platform_indexes.down,
    name: '20260714_223245_add_platform_indexes'
  },
  {
    up: migration_20260715_120000_add_user_avatar_profile.up,
    down: migration_20260715_120000_add_user_avatar_profile.down,
    name: '20260715_120000_add_user_avatar_profile'
  },
];
