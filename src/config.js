export const APOLLO_API_KEY  = process.env.APOLLO_API_KEY  ?? '';
export const PROJECT_ID      = process.env.BQ_PROJECT_ID   ?? 'twenty-lake';
export const SRC_PROJECT     = process.env.BQ_SRC_PROJECT  ?? 'bpms247';
export const DEST_DATASET    = process.env.BQ_DEST_DATASET ?? 'APLO_DATA';
export const BQ_LOCATION     = process.env.BQ_LOCATION     ?? 'EU';
export const BATCH_SIZE      = Number(process.env.BATCH_SIZE ?? 5);

export const DEST_TABLE_ID = `${PROJECT_ID}.${DEST_DATASET}.apollo_enriched_contacts`;
export const LOG_TABLE_ID  = `${PROJECT_ID}.${DEST_DATASET}.apollo_processing_log`;

export const LOG_TABLE_SCHEMA = [
  { name: 'contact_id',    type: 'STRING',    mode: 'REQUIRED' },
  { name: 'apollo_status', type: 'STRING' },
  { name: 'apollo_found',  type: 'BOOLEAN' },
  { name: 'processed_at',  type: 'TIMESTAMP' },
];

export const ENRICHED_TABLE_SCHEMA = [
  { name: 'contact_id',            type: 'STRING' },
  { name: 'status',                type: 'STRING' },
  { name: 'apollo_id',             type: 'STRING' },
  { name: 'full_name',             type: 'STRING' },
  { name: 'first_name',            type: 'STRING' },
  { name: 'last_name',             type: 'STRING' },
  { name: 'linkedin_url',          type: 'STRING' },
  { name: 'photo_url',             type: 'STRING' },
  { name: 'job_title',             type: 'STRING' },
  { name: 'headline',              type: 'STRING' },
  { name: 'seniority',             type: 'STRING' },
  { name: 'departments',           type: 'STRING' },
  { name: 'subdepartments',        type: 'STRING' },
  { name: 'functions',             type: 'STRING' },
  { name: 'work_email',            type: 'STRING' },
  { name: 'email_status',          type: 'STRING' },
  { name: 'personal_email',        type: 'STRING' },
  { name: 'direct_phones',         type: 'STRING' },
  { name: 'city',                  type: 'STRING' },
  { name: 'state',                 type: 'STRING' },
  { name: 'country',               type: 'STRING' },
  { name: 'twitter',               type: 'STRING' },
  { name: 'github',                type: 'STRING' },
  { name: 'facebook',              type: 'STRING' },
  { name: 'org_name',              type: 'STRING' },
  { name: 'org_domain',            type: 'STRING' },
  { name: 'org_website',           type: 'STRING' },
  { name: 'org_linkedin',          type: 'STRING' },
  { name: 'org_twitter',           type: 'STRING' },
  { name: 'org_facebook',          type: 'STRING' },
  { name: 'org_phone',             type: 'STRING' },
  { name: 'org_industry',          type: 'STRING' },
  { name: 'org_keywords',          type: 'STRING' },
  { name: 'org_employees',         type: 'STRING' },
  { name: 'org_founded',           type: 'STRING' },
  { name: 'alexa_rank',            type: 'STRING' },
  { name: 'annual_revenue',        type: 'STRING' },
  { name: 'total_funding',         type: 'STRING' },
  { name: 'latest_funding_stage',  type: 'STRING' },
  { name: 'latest_funding_date',   type: 'STRING' },
  { name: 'techs_used',            type: 'STRING' },
  { name: 'org_address',           type: 'STRING' },
  { name: 'org_city',              type: 'STRING' },
  { name: 'org_state',             type: 'STRING' },
];
