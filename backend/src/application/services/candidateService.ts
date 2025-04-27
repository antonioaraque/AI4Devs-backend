import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { PrismaClient } from '@prisma/client';
import { Application } from '../../domain/models/Application';
import { InterviewStep } from '../../domain/models/InterviewStep';

const prisma = new PrismaClient();

// Definición de etapas finales donde no se permite el cambio
const FINAL_STAGES = ['Rechazado', 'Contratado'];

// Validación del nombre de etapa
const validateStageName = (stageName: string): boolean => {
    if (!stageName || typeof stageName !== 'string') {
        return false;
    }
    
    // Validar longitud máxima
    if (stageName.trim().length === 0 || stageName.length > 100) {
        return false;
    }
    
    return true;
};

export const addCandidate = async (candidateData: any) => {
    try {
        validateCandidateData(candidateData); // Validar los datos del candidato
    } catch (error: any) {
        throw new Error(error);
    }

    const candidate = new Candidate(candidateData); // Crear una instancia del modelo Candidate
    try {
        const savedCandidate = await candidate.save(); // Guardar el candidato en la base de datos
        const candidateId = savedCandidate.id; // Obtener el ID del candidato guardado

        // Guardar la educación del candidato
        if (candidateData.educations) {
            for (const education of candidateData.educations) {
                const educationModel = new Education(education);
                educationModel.candidateId = candidateId;
                await educationModel.save();
                candidate.education.push(educationModel);
            }
        }

        // Guardar la experiencia laboral del candidato
        if (candidateData.workExperiences) {
            for (const experience of candidateData.workExperiences) {
                const experienceModel = new WorkExperience(experience);
                experienceModel.candidateId = candidateId;
                await experienceModel.save();
                candidate.workExperience.push(experienceModel);
            }
        }

        // Guardar los archivos de CV
        if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
            const resumeModel = new Resume(candidateData.cv);
            resumeModel.candidateId = candidateId;
            await resumeModel.save();
            candidate.resumes.push(resumeModel);
        }
        return savedCandidate;
    } catch (error: any) {
        if (error.code === 'P2002') {
            // Unique constraint failed on the fields: (`email`)
            throw new Error('The email already exists in the database');
        } else {
            throw error;
        }
    }
};

export const findCandidateById = async (id: number): Promise<Candidate | null> => {
    try {
        // Validar que el ID es un número positivo
        if (!id || id <= 0 || !Number.isInteger(id)) {
            throw new Error('ID de candidato inválido');
        }
        
        const candidate = await Candidate.findOne(id); // Cambio aquí: pasar directamente el id
        return candidate;
    } catch (error) {
        console.error('Error al buscar el candidato:', error);
        throw new Error('Error al recuperar el candidato');
    }
};

/**
 * Actualiza la etapa de un candidato en el proceso de selección
 * @param candidateId ID del candidato
 * @param stageName Nombre de la etapa a la que se moverá el candidato
 * @param modifiedById ID del empleado que realiza el cambio (para auditoría)
 * @returns La aplicación actualizada o null si no se encuentra el candidato o la etapa
 */
export const updateCandidateStage = async (
    candidateId: number, 
    stageName: string, 
    modifiedById?: number
): Promise<Application | null> => {
    try {
        // Validar parámetros de entrada
        if (!candidateId || candidateId <= 0 || !Number.isInteger(candidateId)) {
            throw new Error('ID de candidato inválido');
        }
        
        if (!validateStageName(stageName)) {
            throw new Error('Nombre de etapa inválido');
        }
        
        // Verificar que el candidato existe
        const candidate = await Candidate.findOne(candidateId);
        if (!candidate) {
            console.error(`Candidato con ID ${candidateId} no encontrado`);
            return null;
        }

        // Buscar la aplicación actual del candidato
        const application = await prisma.application.findFirst({
            where: {
                candidateId: candidateId
            },
            include: {
                interviewStep: true
            }
        });

        if (!application) {
            console.error(`No se encontró ninguna aplicación para el candidato con ID ${candidateId}`);
            return null;
        }

        // Verificar si el candidato ya está en una etapa final (rechazado o contratado)
        if (FINAL_STAGES.includes(application.interviewStep.name)) {
            throw new Error(`No se puede cambiar la etapa del candidato porque ya está en una etapa final: ${application.interviewStep.name}`);
        }

        // Buscar la etapa por nombre
        const interviewStep = await prisma.interviewStep.findFirst({
            where: {
                name: stageName
            }
        });

        if (!interviewStep) {
            console.error(`Etapa con nombre "${stageName}" no encontrada`);
            return null;
        }

        // Datos para la actualización de la aplicación
        const updateData: any = {
            currentInterviewStep: interviewStep.id
        };
        
        // Si se proporciona el ID del usuario que realiza el cambio, guardarlo para auditoría
        if (modifiedById) {
            // Verificar que el empleado existe
            const employeeExists = await prisma.employee.findUnique({
                where: { id: modifiedById }
            });
            
            if (employeeExists) {
                updateData.modifiedById = modifiedById;
            } else {
                console.warn(`El empleado con ID ${modifiedById} no existe. No se guardará la información de auditoría.`);
            }
        }

        // Actualizar la etapa de la aplicación
        const updatedApplication = await prisma.application.update({
            where: {
                id: application.id
            },
            data: updateData,
            include: {
                interviewStep: true,
                candidate: true
            }
        });
        
        // Registrar el cambio en el historial de etapas
        await prisma.stageHistory.create({
            data: {
                applicationId: application.id,
                previousStageId: application.currentInterviewStep,
                newStageId: interviewStep.id,
                modifiedById: modifiedById || 1 // Si no se proporciona un ID, usar un valor por defecto (administrador)
            }
        });

        // Crear y devolver una instancia del modelo Application
        return new Application({
            id: updatedApplication.id,
            positionId: updatedApplication.positionId,
            candidateId: updatedApplication.candidateId,
            applicationDate: updatedApplication.applicationDate,
            currentInterviewStep: updatedApplication.currentInterviewStep,
            notes: updatedApplication.notes,
            interviewStep: interviewStep,
            candidate: candidate,
            modifiedById: updateData.modifiedById
        });
    } catch (error) {
        console.error('Error al actualizar la etapa del candidato:', error);
        throw error;
    }
};
