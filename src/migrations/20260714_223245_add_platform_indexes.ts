import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

const indexes = [
  ['users_country_idx', 'users', 'country'],
  ['users_city_idx', 'users', 'city'],
  ['users_age_group_idx', 'users', 'age_group'],
  ['users_school_grade_idx', 'users', 'school_grade'],
  ['users_team_search_available_idx', 'users', 'team_search_available'],
  ['users_public_profile_idx', 'users', 'public_profile'],
  ['users_interests_order_idx', 'users_interests', '_order'],
  ['users_interests_parent_id_idx', 'users_interests', '_parent_id'],
  ['users_skills_order_idx', 'users_skills', '_order'],
  ['users_skills_parent_id_idx', 'users_skills', '_parent_id'],
  ['users_languages_order_idx', 'users_languages', '_order'],
  ['users_languages_parent_id_idx', 'users_languages', '_parent_id'],
  ['users_social_links_order_idx', 'users_social_links', '_order'],
  ['users_social_links_parent_id_idx', 'users_social_links', '_parent_id'],
  ['applications_user_idx', 'applications', 'user_id'],
  ['applications_item_type_idx', 'applications', 'item_type'],
  ['applications_item_id_idx', 'applications', 'item_id'],
  ['applications_status_idx', 'applications', 'status'],
  ['events_legacy_id_idx', 'events', 'legacy_id'],
  ['events_event_type_idx', 'events', 'event_type'],
  ['events_event_date_idx', 'events', 'event_date'],
  ['events_format_idx', 'events', 'format'],
  ['events_country_idx', 'events', 'country'],
  ['events_registration_deadline_idx', 'events', 'registration_deadline'],
  ['events_created_at_idx', 'events', 'created_at'],
  ['events_updated_at_idx', 'events', 'updated_at'],
  ['events_languages_order_idx', 'events_languages', '_order'],
  ['events_languages_parent_id_idx', 'events_languages', '_parent_id'],
  ['events_materials_order_idx', 'events_materials', '_order'],
  ['events_materials_parent_id_idx', 'events_materials', '_parent_id'],
  ['opportunities_legacy_id_idx', 'opportunities', 'legacy_id'],
  ['opportunities_organization_idx', 'opportunities', 'organization'],
  ['opportunities_opportunity_type_idx', 'opportunities', 'opportunity_type'],
  ['opportunities_country_idx', 'opportunities', 'country'],
  ['opportunities_format_idx', 'opportunities', 'format'],
  ['opportunities_deadline_idx', 'opportunities', 'deadline'],
  ['opportunities_funding_idx', 'opportunities', 'funding'],
  ['opportunities_created_at_idx', 'opportunities', 'created_at'],
  ['opportunities_updated_at_idx', 'opportunities', 'updated_at'],
  ['opportunities_languages_order_idx', 'opportunities_languages', '_order'],
  ['opportunities_languages_parent_id_idx', 'opportunities_languages', '_parent_id'],
  ['opportunities_requirements_order_idx', 'opportunities_requirements', '_order'],
  ['opportunities_requirements_parent_id_idx', 'opportunities_requirements', '_parent_id'],
  ['opportunities_benefits_order_idx', 'opportunities_benefits', '_order'],
  ['opportunities_benefits_parent_id_idx', 'opportunities_benefits', '_parent_id'],
  ['opportunities_documents_order_idx', 'opportunities_documents', '_order'],
  ['opportunities_documents_parent_id_idx', 'opportunities_documents', '_parent_id'],
  ['team_posts_user_idx', 'team_posts', 'user_id'],
  ['team_posts_status_idx', 'team_posts', 'status'],
  ['team_posts_created_at_idx', 'team_posts', 'created_at'],
  ['team_posts_updated_at_idx', 'team_posts', 'updated_at'],
  ['team_posts_required_skills_order_idx', 'team_posts_required_skills', '_order'],
  ['team_posts_required_skills_parent_id_idx', 'team_posts_required_skills', '_parent_id'],
  ['team_posts_own_skills_order_idx', 'team_posts_own_skills', '_order'],
  ['team_posts_own_skills_parent_id_idx', 'team_posts_own_skills', '_parent_id'],
  ['team_posts_interests_order_idx', 'team_posts_interests', '_order'],
  ['team_posts_interests_parent_id_idx', 'team_posts_interests', '_parent_id'],
  ['team_responses_post_idx', 'team_responses', 'post_id'],
  ['team_responses_sender_idx', 'team_responses', 'sender_id'],
  ['team_responses_recipient_idx', 'team_responses', 'recipient_id'],
  ['team_responses_kind_idx', 'team_responses', 'kind'],
  ['team_responses_status_idx', 'team_responses', 'status'],
  ['team_responses_created_at_idx', 'team_responses', 'created_at'],
  ['team_responses_updated_at_idx', 'team_responses', 'updated_at'],
  ['application_status_history_application_idx', 'application_status_history', 'application_id'],
  ['application_status_history_user_idx', 'application_status_history', 'user_id'],
  ['application_status_history_created_at_idx', 'application_status_history', 'created_at'],
  ['application_status_history_updated_at_idx', 'application_status_history', 'updated_at'],
  ['favorites_user_idx', 'favorites', 'user_id'],
  ['favorites_item_type_idx', 'favorites', 'item_type'],
  ['favorites_item_id_idx', 'favorites', 'item_id'],
  ['favorites_created_at_idx', 'favorites', 'created_at'],
  ['favorites_updated_at_idx', 'favorites', 'updated_at'],
  ['notifications_user_idx', 'notifications', 'user_id'],
  ['notifications_type_idx', 'notifications', 'type'],
  ['notifications_read_at_idx', 'notifications', 'read_at'],
  ['notifications_created_at_idx', 'notifications', 'created_at'],
  ['notifications_updated_at_idx', 'notifications', 'updated_at'],
  ['payload_locked_documents_rels_events_id_idx', 'payload_locked_documents_rels', 'events_id'],
  ['payload_locked_documents_rels_opportunities_id_idx', 'payload_locked_documents_rels', 'opportunities_id'],
  ['payload_locked_documents_rels_team_posts_id_idx', 'payload_locked_documents_rels', 'team_posts_id'],
  ['payload_locked_documents_rels_team_responses_id_idx', 'payload_locked_documents_rels', 'team_responses_id'],
  ['payload_locked_documents_rels_application_status_history_id_idx', 'payload_locked_documents_rels', 'application_status_history_id'],
  ['payload_locked_documents_rels_favorites_id_idx', 'payload_locked_documents_rels', 'favorites_id'],
  ['payload_locked_documents_rels_notifications_id_idx', 'payload_locked_documents_rels', 'notifications_id'],
] as const;

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`events_slug_idx\` ON \`events\` (\`slug\`);`);
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`opportunities_slug_idx\` ON \`opportunities\` (\`slug\`);`);

  for (const [name, table, column] of indexes) {
    await db.run(sql.raw(`CREATE INDEX IF NOT EXISTS \`${name}\` ON \`${table}\` (\`${column}\`);`));
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const [name] of indexes) {
    await db.run(sql.raw(`DROP INDEX IF EXISTS \`${name}\`;`));
  }

  await db.run(sql`DROP INDEX IF EXISTS \`events_slug_idx\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`opportunities_slug_idx\`;`);
}
