import { Request, Response } from 'express';
import { addCandidate, findCandidateById, updateCandidateStage as updateStage } from '../../application/services/candidateService';

export const addCandidateController = async (req: Request, res: Response) => {
    try {
        const candidateData = req.body;
        const candidate = await addCandidate(candidateData);
        res.status(201).json({ message: 'Candidate added successfully', data: candidate });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ message: 'Error adding candidate', error: error.message });
        } else {
            res.status(400).json({ message: 'Error adding candidate', error: 'Unknown error' });
        }
    }
};

export const getCandidateById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const candidate = await findCandidateById(id);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Controlador para actualizar la etapa de un candidato en el proceso de selección
 * @param req Request - Debe incluir el ID del candidato en los parámetros y el nombre de la etapa en el cuerpo
 * @param res Response - Devuelve la aplicación actualizada o error si no se puede realizar la operación
 */
export const updateCandidateStage = async (req: Request, res: Response) => {
    try {
        const candidateId = parseInt(req.params.id);
        const { current_interview_step, modified_by_id } = req.body;
        
        // Validación básica de entrada
        if (isNaN(candidateId)) {
            return res.status(400).json({ 
                error: 'Formato de ID inválido', 
                message: 'El ID del candidato debe ser un número válido'
            });
        }
        
        if (!current_interview_step || current_interview_step.trim() === '') {
            return res.status(400).json({ 
                error: 'Datos inválidos', 
                message: 'Se requiere un nombre de etapa (current_interview_step) válido'
            });
        }
        
        // Convertir y validar el ID del usuario que realiza el cambio, si se proporciona
        let modifiedById = undefined;
        if (modified_by_id) {
            modifiedById = parseInt(modified_by_id.toString());
            if (isNaN(modifiedById)) {
                return res.status(400).json({ 
                    error: 'Datos inválidos', 
                    message: 'El ID del usuario que realiza el cambio debe ser un número válido'
                });
            }
        }
        
        // Llamar al servicio con el ID de usuario para auditoría
        const result = await updateStage(candidateId, current_interview_step, modifiedById);
        
        if (result === null) {
            return res.status(404).json({ 
                error: 'Recurso no encontrado',
                message: 'No se encontró el candidato o la etapa especificada'
            });
        }
        
        res.status(200).json({
            message: 'Etapa del candidato actualizada con éxito', 
            data: result
        });
    } catch (error) {
        console.error('Error al actualizar etapa del candidato:', error);
        
        // Manejo específico de errores
        if (error instanceof Error) {
            if (error.message.includes('etapa final')) {
                return res.status(400).json({ 
                    error: 'Operación no permitida',
                    message: error.message
                });
            }
            
            if (error.message.includes('inválido')) {
                return res.status(400).json({ 
                    error: 'Datos inválidos',
                    message: error.message
                });
            }
        }
        
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: 'Ocurrió un error al procesar la solicitud'
        });
    }
};

export { addCandidate };