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

				// Ajouter un badge sur la vue de la barre latérale
				vscode.window.registerWebviewViewProvider('teachassist.welcome', 
					new TeachAssistViewProvider(context.extensionUri, zipFiles.length));

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

	// Enregistrer la vue de la barre latérale
	const provider = new TeachAssistViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('teachassist.welcome', provider)
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}

class TeachAssistViewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private _badgeCount: number;

	constructor(private readonly _extensionUri: vscode.Uri, badgeCount: number = 0) {
		this._badgeCount = badgeCount;
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;
		
		// Définir le badge de notification si nécessaire
		if (this._badgeCount > 0) {
			this._view.badge = {
				tooltip: `${this._badgeCount} fichiers détectés`,
				value: this._badgeCount
			};
		}
		
		// Ne pas ouvrir automatiquement le panneau principal ici
		// vscode.commands.executeCommand('teachassist.openWelcomePanel');
		
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this._extensionUri, 'media'),
				vscode.Uri.joinPath(this._extensionUri, 'src', 'webview')
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Gérer les messages du webview
		webviewView.webview.onDidReceiveMessage(async (message) => {
			switch (message.command) {
				case 'openWelcomePanel':
					vscode.commands.executeCommand('teachassist.openWelcomePanel');
					break;
			}
		});
		
		// Ajouter un écouteur d'événements sur le changement de visibilité de la vue
		webviewView.onDidChangeVisibility(() => {
			if (webviewView.visible) {
				// Ouvrir le panneau principal quand la vue devient visible (quand on clique sur l'icône)
				vscode.commands.executeCommand('teachassist.openWelcomePanel');
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const styleVscUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'welcome.css')
		);

		const iconUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'teachassist.svg')
		);

		return `<!DOCTYPE html>
		<html lang="fr">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>TeachAssist</title>
			<link rel="stylesheet" href="${styleVscUri}">
			<style>
				body {
					padding: 10px;
					display: flex;
					flex-direction: column;
					align-items: center;
				}
				.sidebar-icon {
					width: 64px;
					height: 64px;
					margin-bottom: 15px;
					background-image: url(${iconUri});
					background-size: contain;
					background-repeat: no-repeat;
					background-position: center;
					cursor: pointer;
				}
				h3 {
					text-align: center;
					margin-bottom: 15px;
				}
				.open-button {
					padding: 8px 16px;
					background-color: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border: none;
					border-radius: 2px;
					cursor: pointer;
				}
				.open-button:hover {
					background-color: var(--vscode-button-hoverBackground);
				}
			</style>
		</head>
		<body>
			<div class="sidebar-icon" onclick="openPanel()"></div>
			<h3>TeachAssist</h3>
			<button class="open-button" onclick="openPanel()">Ouvrir le panneau</button>
			
			<script>
				function openPanel() {
					// Envoyer un message pour ouvrir le panneau principal
					const vscode = acquireVsCodeApi();
					vscode.postMessage({ command: 'openWelcomePanel' });
				}
			</script>
		</body>
		</html>`;
	}
}
