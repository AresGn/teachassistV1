import * as fs from 'fs';
import * as path from 'path';
import { ExerciseConfig } from './types';

/**
 * Erreurs possibles lors du chargement de la configuration
 */
export class ConfigLoadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigLoadError';
    }
}

/**
 * Charge la configuration d'un exercice à partir d'un fichier JSON
 * @param exerciseId Identifiant de l'exercice
 * @returns Promise<ExerciseConfig>
 */
export async function loadExerciseConfig(exerciseId: string): Promise<ExerciseConfig> {
    const configDir = path.join(__dirname, '..', '..', 'src', 'configs', 'exercises');
    const configPath = path.join(configDir, `${exerciseId}.json`);

    try {
        // Vérifier si le fichier existe
        if (!fs.existsSync(configPath)) {
            throw new ConfigLoadError(`Configuration file not found for exercise: ${exerciseId}`);
        }

        // Lire et parser le fichier JSON
        const configData = await fs.promises.readFile(configPath, 'utf-8');
        try {
            const config = JSON.parse(configData) as ExerciseConfig;
            
            // Validation minimale
            if (!config.id || !config.name || !config.description) {
                throw new ConfigLoadError(`Invalid configuration format: missing required fields`);
            }
            
            return config;
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new ConfigLoadError(`Invalid JSON format in configuration file: ${error.message}`);
            }
            throw error;
        }
    } catch (error) {
        if (error instanceof ConfigLoadError) {
            throw error;
        }
        throw new ConfigLoadError(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Vérifie si une configuration d'exercice existe
 * @param exerciseId Identifiant de l'exercice
 * @returns boolean
 */
export function exerciseConfigExists(exerciseId: string): boolean {
    const configDir = path.join(__dirname, '..', '..', 'src', 'configs', 'exercises');
    const configPath = path.join(configDir, `${exerciseId}.json`);
    return fs.existsSync(configPath);
} 