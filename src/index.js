import express from 'express';
import { runBatch } from './processor.js';

const app  = express();
const PORT = process.env.PORT ?? 8080;

app.get('/',       (_req, res) => res.json({ status: 'ok' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/run', async (_req, res) => {
  try {
    const result = await runBatch();
    res.json(result);
  } catch (err) {
    console.error('Error en runBatch:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Apollo Enricher escuchando en :${PORT}`);
});
