import * as migration_20260714_165539_add_user_roles from './20260714_165539_add_user_roles';
import * as migration_20260714_223245_add_platform_indexes from './20260714_223245_add_platform_indexes';
import * as migration_20260715_120000_add_user_avatar_profile from './20260715_120000_add_user_avatar_profile';
import * as migration_20260722_225723 from './20260722_225723';
import * as migration_20260725_120000_add_tournament_display_fields from './20260725_120000_add_tournament_display_fields';
import * as migration_20260725_130000_add_content_localizations from './20260725_130000_add_content_localizations';
import * as migration_20260725_140000_add_team_member_moderation from './20260725_140000_add_team_member_moderation';
import * as migration_20260729_123911 from './20260729_123911';
import * as migration_20260729_170000_add_legacy_content_admin_fields from './20260729_170000_add_legacy_content_admin_fields';
import * as migration_20260729_171500_add_operator_settings from './20260729_171500_add_operator_settings';
import * as migration_20260729_191500_add_opportunity_card_fields from './20260729_191500_add_opportunity_card_fields';
import * as migration_20260731_000000_add_team_posts_original_language from './20260731_000000_add_team_posts_original_language';
import * as migration_20260731_000100_add_tournaments_slug_unique_index from './20260731_000100_add_tournaments_slug_unique_index';
import * as migration_20260806_000000_add_event_registration_url from './20260806_000000_add_event_registration_url';
import * as migration_20260807_000000_remove_blog from './20260807_000000_remove_blog';
import * as migration_20260807_010000_fix_team_member_version_fields from './20260807_010000_fix_team_member_version_fields';
import * as migration_20260813_000000_add_page_texts from './20260813_000000_add_page_texts';
import * as migration_20260813_010000_simplify_page_texts_ru_source from './20260813_010000_simplify_page_texts_ru_source';

export const migrations = [
  {
    up: migration_20260714_165539_add_user_roles.up,
    down: migration_20260714_165539_add_user_roles.down,
    name: '20260714_165539_add_user_roles',
  },
  {
    up: migration_20260714_223245_add_platform_indexes.up,
    down: migration_20260714_223245_add_platform_indexes.down,
    name: '20260714_223245_add_platform_indexes',
  },
  {
    up: migration_20260715_120000_add_user_avatar_profile.up,
    down: migration_20260715_120000_add_user_avatar_profile.down,
    name: '20260715_120000_add_user_avatar_profile',
  },
  {
    up: migration_20260722_225723.up,
    down: migration_20260722_225723.down,
    name: '20260722_225723',
  },
  {
    up: migration_20260725_120000_add_tournament_display_fields.up,
    down: migration_20260725_120000_add_tournament_display_fields.down,
    name: '20260725_120000_add_tournament_display_fields',
  },
  {
    up: migration_20260725_130000_add_content_localizations.up,
    down: migration_20260725_130000_add_content_localizations.down,
    name: '20260725_130000_add_content_localizations',
  },
  {
    up: migration_20260725_140000_add_team_member_moderation.up,
    down: migration_20260725_140000_add_team_member_moderation.down,
    name: '20260725_140000_add_team_member_moderation',
  },
  {
    up: migration_20260729_123911.up,
    down: migration_20260729_123911.down,
    name: '20260729_123911'
  },
  {
    up: migration_20260729_170000_add_legacy_content_admin_fields.up,
    down: migration_20260729_170000_add_legacy_content_admin_fields.down,
    name: '20260729_170000_add_legacy_content_admin_fields',
  },
  {
    up: migration_20260729_171500_add_operator_settings.up,
    down: migration_20260729_171500_add_operator_settings.down,
    name: '20260729_171500_add_operator_settings',
  },
  {
    up: migration_20260729_191500_add_opportunity_card_fields.up,
    down: migration_20260729_191500_add_opportunity_card_fields.down,
    name: '20260729_191500_add_opportunity_card_fields',
  },
  {
    up: migration_20260731_000000_add_team_posts_original_language.up,
    down: migration_20260731_000000_add_team_posts_original_language.down,
    name: '20260731_000000_add_team_posts_original_language',
  },
  {
    up: migration_20260731_000100_add_tournaments_slug_unique_index.up,
    down: migration_20260731_000100_add_tournaments_slug_unique_index.down,
    name: '20260731_000100_add_tournaments_slug_unique_index',
  },
  {
    up: migration_20260806_000000_add_event_registration_url.up,
    down: migration_20260806_000000_add_event_registration_url.down,
    name: '20260806_000000_add_event_registration_url',
  },
  {
    up: migration_20260807_000000_remove_blog.up,
    down: migration_20260807_000000_remove_blog.down,
    name: '20260807_000000_remove_blog',
  },
  {
    up: migration_20260807_010000_fix_team_member_version_fields.up,
    down: migration_20260807_010000_fix_team_member_version_fields.down,
    name: '20260807_010000_fix_team_member_version_fields',
  },
  {
    up: migration_20260813_000000_add_page_texts.up,
    down: migration_20260813_000000_add_page_texts.down,
    name: '20260813_000000_add_page_texts',
  },
  {
    up: migration_20260813_010000_simplify_page_texts_ru_source.up,
    down: migration_20260813_010000_simplify_page_texts_ru_source.down,
    name: '20260813_010000_simplify_page_texts_ru_source',
  },
];
