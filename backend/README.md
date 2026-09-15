# Backend API

Esta es la API del proyecto, construida con Node.js y Express. Se encarga de manejar la lógica de negocio, la conexión a la base de datos y proveer los endpoints para el cliente.

## 🛠️ Tecnologías Utilizadas
- Node.js
- Express.js
- Neon PostgreSQL (@neondatabase/serverless)
- Swagger UI (OpenAPI 3.0)
- dotenv

## 📖 Documentación Interactiva (Swagger)
Una vez iniciado el servidor, puedes probar e interactuar con todos los endpoints desde:
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

## 🚀 Inicialización Rápida

1. Abre una terminal en este directorio (`/backend`).
2. Instala las dependencias:
```bash
npm install
```
3. Configura tu variable de entorno en `.env`:
```env
DATABASE_URL=postgresql://usuario:contraseña@ep-ejemplo.us-east-2.aws.neon.tech/neondb?sslmode=require
PORT=3000
```
4. (Opcional) Prueba la conexión con Neon DB:
```bash
npm run test-db
```
5. Inicia el servidor en modo desarrollo:
```bash
npm run dev
```

El servidor se ejecutará por defecto en `http://localhost:3000`.

## 📜 Scripts Disponibles
- `npm run dev`: Inicia el servidor usando Nodemon.
- `npm start`: Inicia el servidor usando Node (para producción).
- `npm test`: Ejecuta la suite de pruebas automáticas con Jest y Supertest.
- `npm run test:watch`: Ejecuta las pruebas en modo observador (watch).
- `npm run test-db`: Ejecuta script de prueba rápida de conexión con Neon DB.

