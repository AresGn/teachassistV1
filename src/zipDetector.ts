import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as vscode from 'vscode';

/**
 * Interface représentant un fichier ZIP d'étudiant détecté
 */
export interface StudentZip {
  studentName: string;    // Nom de l'étudiant
  filePath: string;       // Chemin complet vers le fichier ZIP
  fileName: string;       // Nom du fichier ZIP
  dateSubmitted?: Date;   // Date de soumission (optionnelle)
}

/**
 * Détecte tous les fichiers ZIP dans un dossier donné
 * @param folderPath Le chemin du dossier à analyser
 * @returns Une promesse qui résout avec un tableau de StudentZip
 */
export async function detectZipFiles(folderPath: string): Promise<StudentZip[]> {
  try {
    // Vérifier si le dossier existe
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Le dossier ${folderPath} n'existe pas`);
    }

    // Trouver tous les fichiers ZIP dans le dossier
    const zipFiles = await glob.glob('**/*.zip', { cwd: folderPath, absolute: true });
    
    if (zipFiles.length === 0) {
      return [];
    }

    // Extraire les informations de chaque fichier ZIP
    const studentZips: StudentZip[] = zipFiles.map(zipFile => {
      const fileName = path.basename(zipFile);
      // Enlever l'extension .zip pour avoir le nom de l'étudiant
      const studentName = fileName.replace(/\.zip$/i, '');
      
      // Obtenir les stats du fichier pour la date de création/modification
      const stats = fs.statSync(zipFile);
      
      return {
        studentName: studentName,
        filePath: zipFile,
        fileName: fileName,
        dateSubmitted: stats.mtime
      };
    });

    return studentZips;
  } catch (error) {
    vscode.window.showErrorMessage(`Erreur lors de la détection des fichiers ZIP: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Affiche une liste des fichiers ZIP détectés dans un QuickPick
 * @param zipFiles Le tableau de fichiers ZIP détectés
 * @returns Une promesse qui résout avec le fichier ZIP sélectionné ou undefined si annulé
 */
export async function showZipFilesQuickPick(zipFiles: StudentZip[]): Promise<StudentZip | undefined> {
  if (zipFiles.length === 0) {
    return undefined;
  }

  const items = zipFiles.map(zipFile => ({
    label: zipFile.studentName,
    description: `Soumis le: ${zipFile.dateSubmitted?.toLocaleString() || 'Date inconnue'}`,
    detail: `Fichier: ${zipFile.fileName}`,
    zipFile: zipFile
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Sélectionnez un fichier à analyser'
  });

  return selected?.zipFile;
} 