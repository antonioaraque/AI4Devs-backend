import { PrismaClient } from '@prisma/client';
import { Position } from '../../domain/models/Position';

const prisma = new PrismaClient();

/**
 * Interfaz que define la estructura de respuesta para cada candidato
 */
interface CandidateResponse {
    full_name: string;
    current_interview_step: string;
    average_score: number | null;
}

/**
 * Obtiene todos los candidatos asociados a una posición específica
 * @param positionId ID de la posición
 * @returns Array de candidatos con su información o null si la posición no existe
 */
export const getCandidatesByPositionId = async (positionId: number): Promise<CandidateResponse[] | null> => {
    try {
        // Primero verificamos si la posición existe
        const positionExists = await Position.findOne(positionId);
        
        if (!positionExists) {
            return null;
        }
        
        // Obtenemos todas las aplicaciones para la posición junto con los datos relacionados
        const applications = await prisma.application.findMany({
            where: { 
                positionId: positionId 
            },
            include: {
                candidate: true,
                interviewStep: true,
                interviews: {
                    select: {
                        score: true
                    }
                }
            },
            distinct: ['candidateId'], // Previene duplicados en caso de modelado incorrecto
        });
        
        // Transformamos los resultados al formato de respuesta requerido
        const candidates = applications.map(app => {
            // Calculamos el promedio de los scores de las entrevistas
            let averageScore: number | null = null;
            const validScores = app.interviews
                .filter(interview => interview.score !== null)
                .map(interview => interview.score as number);
                
            if (validScores.length > 0) {
                averageScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
            }
            
            return {
                full_name: `${app.candidate.firstName} ${app.candidate.lastName}`,
                current_interview_step: app.interviewStep.name,
                average_score: averageScore
            };
        });
        
        return candidates;
    } catch (error) {
        console.error('Error al obtener candidatos por posición:', error);
        throw error;
    }
}; 