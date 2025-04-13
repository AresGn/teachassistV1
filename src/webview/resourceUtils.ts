import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Utilitaire pour gérer les ressources (fichiers) utilisées dans le webview
 */
export class ResourceUtils {
    /**
     * Obtient l'URI d'une ressource pour l'utiliser dans un webview
     * @param webview Le webview qui va utiliser la ressource
     * @param extensionUri L'URI de l'extension
     * @param pathParts Les parties du chemin vers la ressource
     * @returns L'URI de la ressource pour le webview
     */
    public static getResourceUri(
        webview: vscode.Webview, 
        extensionUri: vscode.Uri, 
        ...pathParts: string[]
    ): vscode.Uri {
        return webview.asWebviewUri(
            vscode.Uri.joinPath(extensionUri, ...pathParts)
        );
    }

    /**
     * Permet de lire un fichier de ressource et de remplacer les placeholders
     * @param extensionPath Le chemin de l'extension
     * @param filePath Le chemin du fichier à lire
     * @param replacements Les remplacements à effectuer (clé: placeholder, valeur: remplacement)
     */
    public static async getFileContent(
        webview: vscode.Webview,
        extensionUri: vscode.Uri,
        filePath: string,
        replacements: Record<string, string> = {}
    ): Promise<string> {
        const fileUri = vscode.Uri.joinPath(extensionUri, filePath);
        try {
            const content = await vscode.workspace.fs.readFile(fileUri);
            let contentString = Buffer.from(content).toString('utf-8');
            
            // Remplacer tous les placeholders
            Object.entries(replacements).forEach(([placeholder, replacement]) => {
                contentString = contentString.replace(
                    new RegExp(`{{${placeholder}}}`, 'g'), 
                    replacement
                );
            });
            
            return contentString;
        } catch (error) {
            console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
            return '';
        }
    }
} 