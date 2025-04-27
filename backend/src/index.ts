import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import candidateRoutes from './routes/candidateRoutes';
import positionRoutes from './routes/positionRoutes';
import { uploadFile } from './application/services/fileUploadService';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

// Extender la interfaz Request para incluir prisma
declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
    }
  }
}

dotenv.config();
const prisma = new PrismaClient();

export const app = express();
export default app;

// Cargar el archivo de especificación OpenAPI
const swaggerDocument = YAML.load(path.resolve(__dirname, '../api-spec.yaml'));

// Middleware para parsear JSON. Asegúrate de que esto esté antes de tus rutas.
app.use(express.json());

// Middleware para adjuntar prisma al objeto de solicitud
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Middleware para permitir CORS desde http://localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Configurar la documentación Swagger/OpenAPI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LTI Talent Tracking System API Documentation'
}));

// Import and use candidateRoutes
app.use('/candidates', candidateRoutes);

// Import and use positionRoutes - Nuevo endpoint para kanban
app.use('/positions', positionRoutes);

// Route for file uploads
app.post('/upload', uploadFile);

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const port = 3010;

app.get('/', (req, res) => {
  res.send('Hola LTI! Visita <a href="/api-docs">Documentación de la API</a> para ver los endpoints disponibles.');
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.type('text/plain'); 
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api-docs`);
});
