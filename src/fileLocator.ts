import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { glob } from 'glob';

export class FileLocator {
    constructor(private workspaceRoot: string) {}

    /**
     * Recherche les fichiers Java dans un dossier d'extraction
     * @param extractPath Chemin du dossier extrait
     * @returns Liste des chemins des fichiers Java trouvés
     */
    async findJavaFiles(extractPath: string): Promise<string[]> {
        try {
            // Utiliser glob pour chercher récursivement tous les fichiers Java
            const files = await glob('**/*.java', {
                cwd: extractPath,
                absolute: true,
                nocase: true // Pour gérer les variations de casse
            });

            return files;
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de la recherche des fichiers Java: ${error}`);
            return [];
        }
    }

    /**
     * Associe les fichiers Java trouvés à leurs dossiers d'extraction
     * @param extractedPaths Map des chemins d'extraction par fichier ZIP
     * @returns Map des chemins de fichiers Java par nom de fichier ZIP
     */
    async locateAllJavaFiles(extractedPaths: Map<string, string>): Promise<Map<string, string[]>> {
        const results = new Map<string, string[]>();

        for (const [zipPath, extractPath] of extractedPaths.entries()) {
            // Utiliser le nom du fichier ZIP comme clé
            const zipBaseName = path.basename(zipPath, '.zip');
            
            // Chercher tous les fichiers Java
            const javaFiles = await this.findJavaFiles(extractPath);
            
            if (javaFiles.length === 0) {
                vscode.window.showWarningMessage(`Aucun fichier Java trouvé dans ${zipBaseName}`);
            } else {
                results.set(zipBaseName, javaFiles);
                vscode.window.showInformationMessage(`${javaFiles.length} fichiers Java trouvés dans ${zipBaseName}`);
            }
        }

        return results;
    }
} 