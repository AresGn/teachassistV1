// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// Importer le détecteur de ZIP et le panneau de bienvenue
import { detectZipFiles, showZipFilesQuickPick } from './zipDetector';
import { WelcomePanel } from './webview/welcomePanel';
import { ZipExtractor } from './zipExtractor';
import { FileLocator } from './fileLocator';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "teachassist" is now active!');

	// Ouvrir automatiquement le panneau de bienvenue à l'activation
	WelcomePanel.render(context.extensionUri);

	// Commande pour ouvrir le panneau de bienvenue
	const openWelcomePanelCommand = vscode.commands.registerCommand('teachassist.openWelcomePanel', () => {
		WelcomePanel.render(context.extensionUri);
	});

	// Commande pour détecter les fichiers ZIP
	const detectZipCommand = vscode.commands.registerCommand('teachassist.detectZip', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('Veuillez ouvrir un dossier contenant les soumissions des étudiants.');
			return;
		}

		const folderPath = workspaceFolders[0].uri.fsPath;
		
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Détection des fichiers ZIP",
			cancellable: false
		}, async (progress) => {
			progress.report({ increment: 0, message: "Recherche des fichiers ZIP..." });
			
			const zipFiles = await detectZipFiles(folderPath);
			
			progress.report({ increment: 100, message: "Terminé" });
			
			if (zipFiles.length > 0) {
				context.workspaceState.update('teachassist.zipFiles', zipFiles);
				
				if (WelcomePanel.currentPanel) {
					WelcomePanel.currentPanel.updateZipList(zipFiles);
				}

				vscode.window.showInformationMessage(`${zipFiles.length} fichiers ZIP trouvés`);
			} else {
				vscode.window.showWarningMessage('Aucun fichier ZIP trouvé dans le dossier de travail.');
			}
		});
	});

	// Commande pour extraire et localiser les fichiers
	const extractAndLocateCommand = vscode.commands.registerCommand('teachassist.extractAndLocate', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			vscode.window.showErrorMessage('Veuillez ouvrir un dossier de travail.');
			return;
		}

		// Récupérer les fichiers ZIP détectés
		const zipFiles = context.workspaceState.get<any[]>('teachassist.zipFiles', []);
		if (zipFiles.length === 0) {
			vscode.window.showWarningMessage('Aucun fichier ZIP détecté. Veuillez d\'abord détecter les fichiers ZIP.');
			return;
		}

		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		const zipExtractor = new ZipExtractor(workspaceRoot);
		const fileLocator = new FileLocator(workspaceRoot);

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Traitement des fichiers",
			cancellable: false
		}, async (progress) => {
			try {
				// Étape 1: Extraction des ZIP
				progress.report({ increment: 0, message: "Extraction des fichiers ZIP..." });
				
				// On utilise filePath au lieu de l'objet directement
				const zipPaths = zipFiles.map(zip => zip.filePath);
				const extractedPaths = await zipExtractor.extractMultipleZips(zipPaths);
				
				// Étape 2: Localisation des fichiers Java
				progress.report({ increment: 50, message: "Recherche des fichiers Java..." });
				const javaFiles = await fileLocator.locateAllJavaFiles(extractedPaths);

				// Stocker les résultats pour les étapes suivantes
				context.workspaceState.update('teachassist.javaFiles', Array.from(javaFiles.entries()));

				// Mettre à jour l'interface
				if (WelcomePanel.currentPanel) {
					WelcomePanel.currentPanel.updateJavaFiles(javaFiles);
				}

				progress.report({ increment: 100, message: "Terminé" });
				
				// Calculer le nombre total de fichiers Java trouvés
				let totalJavaFiles = 0;
				let emptyArchives = 0;
				for (const files of javaFiles.values()) {
					totalJavaFiles += files.length;
					if (files.length === 0) {
						emptyArchives++;
					}
				}
				
				// Message différent selon qu'il y a des archives vides ou non
				if (emptyArchives > 0) {
					vscode.window.showWarningMessage(
						`${totalJavaFiles} fichiers Java trouvés dans ${javaFiles.size} archives ZIP. Attention: ${emptyArchives} archive(s) ne contiennent aucun fichier Java.`
					);
				} else {
					vscode.window.showInformationMessage(
						`${totalJavaFiles} fichiers Java trouvés dans ${javaFiles.size} archives ZIP.`
					);
				}
			} catch (error) {
				vscode.window.showErrorMessage(`Erreur lors du traitement des fichiers: ${error}`);
			}
		});
	});

	// Autres commandes existantes...
	const analyzeCodeCommand = vscode.commands.registerCommand('teachassist.analyzeCode', async () => {
		vscode.window.showInformationMessage('Analyse du code Java...');
	});

	const showResultsCommand = vscode.commands.registerCommand('teachassist.showResults', async () => {
		vscode.window.showInformationMessage('Affichage des résultats...');
	});

	const exportResultsCommand = vscode.commands.registerCommand('teachassist.exportResults', async () => {
		vscode.window.showInformationMessage('Export des résultats...');
	});

	// Enregistrer toutes les commandes
	context.subscriptions.push(
		openWelcomePanelCommand,
		detectZipCommand,
		extractAndLocateCommand,
		analyzeCodeCommand,
		showResultsCommand,
		exportResultsCommand
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
