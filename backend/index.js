// Importar las dependencias necesarias
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import indexRoutes from './routes/index.routes.js';

const app = express();

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
    ],
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