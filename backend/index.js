import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import indexRoutes from './routes/index.routes.js';
import errorHandler from './middleware/error.js';

const app = express();

// 1. Endurecimiento de cabeceras HTTP con Helmet
app.use(helmet());

// 2. CORS restringido a orígenes permitidos
const origenesPermitidos = [
  'http://localhost:5173', // Vite Frontend
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (como Postman/Insomnia/Mobile apps) o en la lista blanca
      if (!origin || origenesPermitidos.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Acceso bloqueado por política de CORS'));
      }
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

// Middleware centralizado de errores
app.use(errorHandler);

export default app;