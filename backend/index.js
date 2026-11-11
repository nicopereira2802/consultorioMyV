import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import indexRoutes from './routes/index.routes.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (herramientas locales, apps móviles nativas, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:4173',
        'http://127.0.0.1:4173',
        'http://localhost:3000',
      ];

      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Bloqueado por CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.send('¡Hola! Mi servidor backend con Express está funcionando.');
});

// Usar rutas
app.use('/', indexRoutes);

export default app;
