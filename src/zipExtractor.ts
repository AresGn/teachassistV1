import * as vscode from 'vscode';
import AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs-extra';

export class ZipExtractor {
    constructor(private workspaceRoot: string) {}

    /**
     * Extrait un fichier ZIP dans un dossier dédié
     * @param zipPath Chemin du fichier ZIP
     * @returns Le chemin du dossier d'extraction ou undefined en cas d'erreur
     */
    async extractZip(zipPath: string): Promise<string | undefined> {
        try {
            // Créer un nom de dossier basé sur le nom du ZIP (sans extension)
            const zipBaseName = path.basename(zipPath, '.zip');
            const extractPath = path.join(this.workspaceRoot, 'extracted', zipBaseName);

            // S'assurer que le dossier d'extraction n'existe pas déjà
            await fs.remove(extractPath);
            await fs.ensureDir(extractPath);

            // Extraire le ZIP
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(extractPath, true);

            return extractPath;
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de l'extraction du ZIP ${path.basename(zipPath)}: ${error}`);
            return undefined;
        }
    }

    /**
     * Extrait plusieurs fichiers ZIP
     * @param zipPaths Liste des chemins des fichiers ZIP
     * @returns Map des chemins d'extraction par fichier ZIP
     */
    async extractMultipleZips(zipPaths: string[]): Promise<Map<string, string>> {
        const results = new Map<string, string>();
        
        for (const zipPath of zipPaths) {
            const extractPath = await this.extractZip(zipPath);
            if (extractPath) {
                results.set(zipPath, extractPath);
            }
        }

        return results;
    }
} 