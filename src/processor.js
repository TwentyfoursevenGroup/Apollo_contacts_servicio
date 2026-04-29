import { BigQuery } from '@google-cloud/bigquery';
import {
  PROJECT_ID, SRC_PROJECT, BATCH_SIZE,
  DEST_TABLE_ID, LOG_TABLE_ID, LOG_TABLE_SCHEMA, ENRICHED_TABLE_SCHEMA,
} from './config.js';
import { safeStr, flattenApolloData } from './utils.js';
import { searchContact } from './apolloClient.js';

const bq    = new BigQuery({ projectId: PROJECT_ID });
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- setup ----------

async function ensureTable(tableId, schema) {
  const [, datasetId, tblId] = tableId.split('.');
  const table = bq.dataset(datasetId).table(tblId);
  const [exists] = await table.exists();
  if (!exists) {
    await bq.dataset(datasetId).createTable(tblId, { schema });
    console.log('Tabla creada:', tableId);
  }
}

// Crea ambas tablas si no existen — se llama al arrancar el servicio
async function ensureTables() {
  await Promise.all([
    ensureTable(LOG_TABLE_ID,  LOG_TABLE_SCHEMA),
    ensureTable(DEST_TABLE_ID, ENRICHED_TABLE_SCHEMA),
  ]);
}

// ---------- query ----------

async function fetchPendingContacts() {
  const query = `
    SELECT
      cu.id,
      ANY_VALUE(cu.name)     AS name,
      ANY_VALUE(cu.position) AS position,
      ANY_VALUE(cu.email)    AS email,
      ANY_VALUE(cu.phone)    AS phone,
      STRING_AGG(DISTINCT pr.name,   ", ") AS ProjectName,
      STRING_AGG(DISTINCT pr.client, ", ") AS client
    FROM \`${SRC_PROJECT}.ds_customer_appcustomerapp.contacts\` AS cu
    LEFT JOIN \`${SRC_PROJECT}.ds_customer_appcustomerapp.contact_folder\` AS cf
           ON cu.id = cf.contact_id
    LEFT JOIN \`${SRC_PROJECT}.ds_customer_appcustomerapp.folders\` AS fl
           ON cf.folder_id = fl.id
    LEFT JOIN \`${SRC_PROJECT}.ds_customer_appcustomerapp.projects\` AS pr
           ON fl.project_id = pr.id
    LEFT JOIN \`${SRC_PROJECT}.ds_customer_appcustomerapp.user_types\` AS ut
           ON cf.type = ut.id
    WHERE ut.name IN ('Client', 'Agency')
    GROUP BY cu.id
    HAVING CAST(cu.id AS STRING) NOT IN (
      SELECT contact_id FROM \`${LOG_TABLE_ID}\`
    )
    ORDER BY cu.id ASC
    LIMIT ${BATCH_SIZE}
  `;

  const [rows] = await bq.query({ query });
  return rows;
}

// ---------- save ----------

async function saveEnriched(rows) {
  if (!rows.length) return;
  const [datasetId, tableId] = [DEST_TABLE_ID.split('.')[1], DEST_TABLE_ID.split('.')[2]];
  await bq.dataset(datasetId).table(tableId).insert(rows, { ignoreUnknownValues: true });
  console.log(`Insertados ${rows.length} registros en ${DEST_TABLE_ID}`);
}

async function saveLog(rows) {
  if (!rows.length) return;
  const [datasetId, tableId] = [LOG_TABLE_ID.split('.')[1], LOG_TABLE_ID.split('.')[2]];
  await bq.dataset(datasetId).table(tableId).insert(rows);
  console.log(`Log actualizado: ${rows.length} contactos marcados como revisados`);
}

// ---------- run ----------

export async function runBatch() {
  await ensureTables();

  console.log(`Consultando contactos pendientes (batch=${BATCH_SIZE})...`);
  const rows = await fetchPendingContacts();

  if (!rows.length) {
    console.log('No quedan contactos pendientes.');
    return { processed: 0, found: 0, not_found: 0, pending: false };
  }

  console.log(`Procesando ${rows.length} contactos...`);
  const enrichedRows = [];
  const logRows      = [];
  let   foundCount   = 0;

  for (const row of rows) {
    const cid      = safeStr(row.id);
    const fullName = safeStr(row.name);
    const email    = safeStr(row.email);
    const position = safeStr(row.position);
    const rawClient = safeStr(row.client) || safeStr(row.ProjectName);
    const company   = rawClient.split(',')[0].trim();

    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ');

    const { data, status } = await searchContact({
      email, firstName, lastName, company, position,
    });

    const found = status !== 'not_found';
    if (found) foundCount++;

    enrichedRows.push(flattenApolloData(cid, data ?? {}, status));
    logRows.push({
      contact_id:    cid,
      apollo_status: status,
      apollo_found:  found,
      processed_at:  BigQuery.timestamp(new Date()),
    });

    await sleep(400);
  }

  await saveEnriched(enrichedRows);
  await saveLog(logRows);

  const result = {
    processed: rows.length,
    found:     foundCount,
    not_found: rows.length - foundCount,
    pending:   rows.length === BATCH_SIZE,
  };
  console.log('Batch completado:', result);
  return result;
}
