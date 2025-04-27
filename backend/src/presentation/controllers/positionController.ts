import { Request, Response } from 'express';
import { getCandidatesByPositionId } from '../../application/services/positionService';

/**
 * Controlador para obtener todos los candidatos asociados a una posición
 * @param req Request - Debe incluir el ID de la posición en los parámetros
 * @param res Response - Devuelve un array de candidatos con su información
 */
export const getCandidatesByPosition = async (req: Request, res: Response) => {
    try {
        const positionId = parseInt(req.params.id);
        
        if (isNaN(positionId)) {
            return res.status(400).json({ 
                error: 'Formato de ID inválido', 
                message: 'El ID de la posición debe ser un número válido'
            });
        }
        
        const candidates = await getCandidatesByPositionId(positionId);
        
        if (candidates === null) {
            return res.status(404).json({ 
                error: 'Posición no encontrada',
                message: `No se encontró ninguna posición con ID ${positionId}`
            });
        }
        
        res.status(200).json(candidates);
    } catch (error) {
        console.error('Error al obtener candidatos por posición:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: 'Ocurrió un error al procesar la solicitud'
        });
    }
}; 