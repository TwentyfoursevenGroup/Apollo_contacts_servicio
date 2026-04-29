# Apollo Enricher — Cloud Run Service

Servicio Node.js desplegado en Google Cloud Run que lee contactos de BigQuery, los busca en Apollo.io y guarda los resultados en nuevas tablas de BigQuery.

## Qué hace

1. Lee contactos pendientes de `bpms247.ds_customer_appcustomerapp.contacts`
2. Los busca en Apollo.io usando 4 estrategias (email, empresa, cargo, búsqueda por nombre)
3. Guarda los datos enriquecidos en `apollo_enriched_contacts`
4. Marca cada contacto como revisado en `apollo_processing_log` con su estado (`found_by_email`, `found_by_company`, `not_found`, etc.)

## Tablas BigQuery generadas

Se crean automáticamente en `twenty-lake.APLO_DATA` la primera vez que se ejecuta.

| Tabla | Descripción |
|---|---|
| `apollo_enriched_contacts` | Datos completos de Apollo para cada contacto |
| `apollo_processing_log` | Tracking: contacto revisado, estado y timestamp |

## Estructura del proyecto

```
src/
├── index.js          # Express — entry point Cloud Run
├── processor.js      # Lógica principal: BQ + bucle de contactos
├── apolloClient.js   # Llamadas a la API de Apollo.io
├── utils.js          # Helpers (flatten, similarity...)
└── config.js         # Variables de entorno y schemas BQ
Dockerfile
package.json
```

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `APOLLO_API_KEY` | API key de Apollo.io | — |
| `BQ_PROJECT_ID` | Proyecto GCP destino | `twenty-lake` |
| `BQ_SRC_PROJECT` | Proyecto GCP origen | `bpms247` |
| `BQ_DEST_DATASET` | Dataset BigQuery destino | `APLO_DATA` |
| `BQ_LOCATION` | Región BigQuery | `EU` |
| `BATCH_SIZE` | Contactos por ejecución | `5` |

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/run` | Lanza un batch de procesamiento |

Respuesta de `/run`:
```json
{
  "processed": 5,
  "found": 3,
  "not_found": 2,
  "pending": true
}
```
`pending: true` significa que quedan más contactos por procesar.

## Desarrollo local

```bash
npm install
cp .env.example .env
# edita .env con tus valores

npm run dev
# servidor en http://localhost:8080

# lanzar un batch
curl -X POST http://localhost:8080/run
```

Para autenticarte con BigQuery en local necesitas tener `gcloud` instalado:
```bash
gcloud auth application-default login
```

## Despliegue en Cloud Run

```bash
gcloud run deploy apollo-enricher \
  --source . \
  --region europe-west1 \
  --project twenty-lake \
  --set-env-vars APOLLO_API_KEY=tu_api_key,BQ_PROJECT_ID=twenty-lake,BQ_SRC_PROJECT=bpms247,BQ_DEST_DATASET=APLO_DATA,BQ_LOCATION=EU,BATCH_SIZE=5 \
  --no-allow-unauthenticated \
  --timeout 900
```

En Cloud Run no se necesita ningún archivo de credenciales — la autenticación con BigQuery es automática a través del Service Account asignado al servicio.

## Programar ejecución automática (Cloud Scheduler)

```bash
SERVICE_URL=$(gcloud run services describe apollo-enricher \
  --region=europe-west1 --format='value(status.url)' --project=twenty-lake)

gcloud scheduler jobs create http apollo-enricher-job \
  --location=europe-west1 \
  --schedule="0 */6 * * *" \
  --uri="${SERVICE_URL}/run" \
  --http-method=POST \
  --oidc-service-account-email=apollo-enricher-sa@twenty-lake.iam.gserviceaccount.com \
  --project=twenty-lake
```

Cambia `"0 */6 * * *"` según necesites:
- Cada 4 horas: `"0 */4 * * *"`
- Una vez al día a las 8am: `"0 8 * * *"`
- Cada hora: `"0 * * * *"`
