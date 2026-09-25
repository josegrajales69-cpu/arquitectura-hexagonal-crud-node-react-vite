import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './infrastructure/adapters/inbound/http/controllers.js';
import { pool } from './infrastructure/config/database.js';
import { DomainError } from './domain/errors/DomainError.js';

const app = express();
const allowedOrigins = new Set((process.env.CLIENT_ORIGINS ?? process.env.CLIENT_ORIGIN ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()));
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://localhost:5174');
}
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)) }));
app.use(express.json({ limit: '1mb' }));
app.get('/health', async (_req,res) => {
  try { await pool.query('SELECT 1'); res.json({status:'ok',service:'nexus-gaming-api'}); }
  catch { res.status(503).json({status:'database_unavailable'}); }
});
app.use('/api',router);
app.use((err,_req,res,_next) => {
  if (err instanceof DomainError) return res.status(err.status).json({error:err.message});
  if (err.code === '23505') return res.status(409).json({error:'Ya existe un registro con esos datos.'});
  console.error(err);
  res.status(500).json({error:'Ocurrió un error interno.'});
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port,'0.0.0.0',() => console.log(`NEXUS API disponible en http://localhost:${port}/api`));
