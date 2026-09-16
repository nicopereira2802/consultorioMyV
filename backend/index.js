// Importar las dependencias necesarias
import 'dotenv/config';
import express from 'express';
import sequelize from './config/database.js';
import cors from 'cors';
import indexRoutes from './routes/index.routes.js';
import { sincronizarModelos } from './models/index.model.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('¡Hola! Mi servidor backend con Express está funcionando.');
});

// Usar rutas
//app.use('/', indexRoutes);

const bootstrap = async () => {
  try {
    
    // 1. Verificar la conexión a la base de datos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');

    // 2. Esperar a que los modelos se sincronicen
    await sincronizarModelos();

    // 3. Iniciar el servidor Express (si estás en index.js)
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });

  } catch (error) {
    console.error('No se pudo conectar o sincronizar la base de datos:', error);
    process.exit(1); // Opcional: detiene el proceso de Node si falla la DB
  }
};

bootstrap();