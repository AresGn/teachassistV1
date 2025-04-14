import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { StudentZip } from '../zipDetector';
import { ResourceUtils } from './resourceUtils';

// Définir l'interface pour les configurations d'exercices
interface ExerciseConfig {
    id: string;
    name: string;
    description: string;
    rules: any;
}

// Interface pour les résultats d'analyse
interface AnalysisResult {
    exerciseId: string;
    findings: Array<{
        ruleId: string;
        description: string;
        status: 'passed' | 'failed' | 'warning' | 'info';
        message?: string;
    }>;
    syntaxErrors: Array<{
        line: number;
        column: number;
        message: string;
        code?: string;
    }>;
    metadata?: {
        analysisDate: string;
        parserVersion: string;
    };
}

export class WelcomePanel {
    public static currentPanel: WelcomePanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _zipFiles: StudentZip[] = [];
    private _javaFiles: Map<string, string[]> = new Map();
    private readonly _extensionUri: vscode.Uri;
    private _exerciseConfigs: ExerciseConfig[] = [];
    private _analysisResults: Map<string, AnalysisResult> = new Map();

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        
        // Charger les configurations disponibles
        this._loadExerciseConfigs();
        
        // Initialiser le HTML de façon asynchrone
        this._updateWebviewContent();
        
        // Gérer les messages du webview
        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'detectZip':
                        vscode.commands.executeCommand('teachassist.detectZip');
                        break;
                    case 'extractAndLocate':
                        vscode.commands.executeCommand('teachassist.extractAndLocate');
                        break;
                    case 'analyzeCode':
                        // Transmettre l'ID de configuration sélectionné
                        vscode.commands.executeCommand('teachassist.analyzeCode', { 
                            configId: message.configId || 'test-basic' 
                        });
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    // Méthode pour charger les configurations d'exercices disponibles
    private async _loadExerciseConfigs() {
        try {
            const configsDir = path.join(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '', 'src', 'configs', 'exercises');
            if (fs.existsSync(configsDir)) {
                const files = fs.readdirSync(configsDir).filter(file => file.endsWith('.json'));
                this._exerciseConfigs = [];
                
                for (const file of files) {
                    try {
                        const filePath = path.join(configsDir, file);
                        const content = fs.readFileSync(filePath, 'utf8');
                        const config = JSON.parse(content) as ExerciseConfig;
                        this._exerciseConfigs.push(config);
                    } catch (err) {
                        console.error(`Erreur lors du chargement de ${file}:`, err);
                    }
                }
            } else {
                // Si le dossier n'existe pas, ajouter une configuration par défaut
                this._exerciseConfigs = [{
                    id: 'test-basic',
                    name: 'Test de base',
                    description: 'Un exercice simple pour tester le système d\'analyse',
                    rules: {}
                }];
            }
        } catch (err) {
            console.error('Erreur lors du chargement des configurations:', err);
            // Configuration par défaut en cas d'erreur
            this._exerciseConfigs = [{
                id: 'test-basic',
                name: 'Test de base',
                description: 'Un exercice simple pour tester le système d\'analyse',
                rules: {}
            }];
        }
    }

    public static render(extensionUri: vscode.Uri) {
        if (WelcomePanel.currentPanel) {
            // S'assurer que le panel est bien visible et au premier plan
            WelcomePanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
            // Mettre à jour le contenu pour s'assurer qu'il est à jour
            WelcomePanel.currentPanel._updateWebviewContent();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'teachassistWelcome',
            'TeachAssist',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'src', 'webview')
                ]
            }
        );

        // Configurer l'icône de l'extension dans la barre d'outils
        panel.iconPath = {
            light: vscode.Uri.joinPath(extensionUri, 'media', 'teachassist.svg'),
            dark: vscode.Uri.joinPath(extensionUri, 'media', 'teachassist.svg')
        };

        WelcomePanel.currentPanel = new WelcomePanel(panel, extensionUri);
    }

    public updateZipList(zipFiles: StudentZip[]) {
        this._zipFiles = zipFiles;
        this._updateWebviewContent();
    }

    public updateJavaFiles(javaFiles: Map<string, string[]>) {
        this._javaFiles = javaFiles;
        this._updateWebviewContent();
    }

    // Nouvelle méthode pour mettre à jour les résultats d'analyse
    public updateAnalysisResults(results: Map<string, AnalysisResult>) {
        this._analysisResults = results;
        this._updateWebviewContent();
    }
    
    private async _updateWebviewContent() {
        this._panel.webview.html = await this._getWebviewContent();
    }

    private async _getWebviewContent() {
        try {
            // Utiliser le ResourceUtils pour obtenir les ressources
            const styleUri = ResourceUtils.getResourceUri(
                this._panel.webview,
                this._extensionUri,
                'src', 'webview', 'welcome.css'
            );
            
            // Définir les classes actives pour les phases
            const detectionPhaseClass = !this._zipFiles.length ? 'active' : (this._zipFiles.length > 0 ? 'completed' : '');
            const extractionPhaseClass = this._zipFiles.length && !this._javaFiles.size ? 'active' : (this._javaFiles.size > 0 ? 'completed' : '');
            const analysisPhaseClass = this._javaFiles.size > 0 && !this._analysisResults.size ? 'active' : (this._analysisResults.size > 0 ? 'completed' : '');
            const resultsPhaseClass = this._analysisResults.size > 0 ? 'active' : '';
            
            // Calculer le pourcentage de progression global
            let progressPercentage = 0;
            if (this._zipFiles.length > 0) { progressPercentage = 25; }
            if (this._javaFiles.size > 0) { progressPercentage = 50; }
            if (this._analysisResults.size > 0) { progressPercentage = 100; }
            
            // Générer le contenu dynamique
            const detectButtonHtml = !this._zipFiles.length 
                ? '<button class="button" onclick="detectZip()">Détecter les fichiers ZIP</button>' 
                : '';
                
            // Générer le HTML pour les statistiques
            let statsHtml = '';
            if (this._zipFiles.length > 0) {
                statsHtml += `
                    <div class="stat-card">
                        <div class="stat-number">${this._zipFiles.length}</div>
                        <div class="stat-label">Fichiers ZIP</div>
                    </div>
                `;
                
                // Ajouter des stats sur les fichiers Java si disponibles
                if (this._javaFiles.size > 0) {
                    let totalJavaFiles = 0;
                    let emptyArchives = 0;
                    for (const files of this._javaFiles.values()) {
                        totalJavaFiles += files.length;
                        if (files.length === 0) {
                            emptyArchives++;
                        }
                    }
                    
                    statsHtml += `
                        <div class="stat-card">
                            <div class="stat-number">${totalJavaFiles}</div>
                            <div class="stat-label">Fichiers Java</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${this._javaFiles.size - emptyArchives}</div>
                            <div class="stat-label">Archives avec du Java</div>
                        </div>
                    `;
                    
                    if (emptyArchives > 0) {
                        statsHtml += `
                            <div class="stat-card">
                                <div class="stat-number" style="color: #ef4444;">${emptyArchives}</div>
                                <div class="stat-label">Archives sans Java</div>
                            </div>
                        `;
                    }
                }
            }
            
            // Générer le HTML pour la liste des fichiers ZIP
            const zipListHtml = this._zipFiles.length > 0 
                ? `
                    <div class="zip-list">
                        <h3>Fichiers ZIP détectés (${this._zipFiles.length})</h3>
                        <ul>
                            ${this._zipFiles.map(zip => `
                                <li>
                                    <strong>${zip.fileName}</strong>
                                    <br>
                                    <small>Soumis le: ${zip.dateSubmitted?.toLocaleString() || 'Date inconnue'}</small>
                                </li>
                            `).join('')}
                        </ul>
                        <button class="button" onclick="extractAndLocate()">Extraire et localiser les fichiers</button>
                    </div>
                `
                : '';
            
            // Calculer le nombre total de fichiers Java
            let totalJavaFiles = 0;
            let emptyArchives = 0;
            for (const files of this._javaFiles.values()) {
                totalJavaFiles += files.length;
                if (files.length === 0) {
                    emptyArchives++;
                }
            }
    
            // Générer le HTML pour la liste des fichiers Java
            const javaFilesHtml = this._javaFiles.size > 0
                ? `
                    <div class="java-files">
                        <h3>Fichiers Java trouvés (${totalJavaFiles} dans ${this._javaFiles.size} archives${emptyArchives > 0 ? `, dont ${emptyArchives} sans fichiers Java` : ''})</h3>
                        <ul>
                            ${Array.from(this._javaFiles.entries()).map(([zipName, filePaths]) => `
                                <li class="${filePaths.length === 0 ? 'no-files' : ''}">
                                    <strong>Fichier ZIP: ${zipName}</strong>
                                    <br>
                                    ${filePaths.length === 0 
                                    ? '<small class="warning">Aucun fichier Java trouvé dans cette archive</small>' 
                                    : `<small>${filePaths.length} fichier(s) Java trouvé(s)</small>
                                        <ul class="nested-files">
                                            ${filePaths.map(filePath => `
                                                <li>
                                                    <small>${path.basename(filePath)}</small>
                                                </li>
                                            `).join('')}
                                        </ul>`
                                    }
                                </li>
                            `).join('')}
                        </ul>
                        <button class="button" onclick="analyzeCode()">Analyser le code</button>
                    </div>
                `
                : '';
            
            // Générer le HTML pour le sélecteur de configuration
            const configSelectorHtml = this._javaFiles.size > 0
                ? `
                    <div class="config-selector-container">
                        <h3>Configuration d'analyse</h3>
                        <p>Veuillez sélectionner la configuration à utiliser pour l'analyse du code :</p>
                        <select id="config-selector" onchange="updateConfigDescription()">
                            ${this._exerciseConfigs.map(config => `
                                <option value="${config.id}" ${config.id === 'test-basic' ? 'selected' : ''}>${config.name}</option>
                            `).join('')}
                        </select>
                        <div id="config-description" class="config-description">
                            ${this._exerciseConfigs.find(c => c.id === 'test-basic')?.description || 'Aucune description disponible.'}
                        </div>
                        <script>
                            function updateConfigDescription() {
                                const select = document.getElementById('config-selector');
                                const descriptions = ${JSON.stringify(this._exerciseConfigs.reduce((acc, config) => {
                                    acc[config.id] = config.description;
                                    return acc;
                                }, {} as Record<string, string>))};
                                
                                const description = descriptions[select.value] || 'Aucune description disponible.';
                                document.getElementById('config-description').textContent = description;
                            }
                        </script>
                    </div>
                `
                : '';

            // Générer le HTML pour les résultats d'analyse
            const analysisResultsHtml = this._analysisResults.size > 0
                ? `
                    <div class="analysis-results-container">
                        <h2>Résultats d'analyse</h2>
                        <div class="results-summary">
                            <div class="result-stat">
                                <span class="stat-value">${this._analysisResults.size}</span>
                                <span class="stat-label">Fichiers analysés</span>
                            </div>
                            <div class="result-stat">
                                <span class="stat-value">${Array.from(this._analysisResults.values()).reduce((count, result) => 
                                    count + result.findings.filter(f => f.status === 'passed').length, 0)}</span>
                                <span class="stat-label">Règles respectées</span>
                            </div>
                            <div class="result-stat">
                                <span class="stat-value">${Array.from(this._analysisResults.values()).reduce((count, result) => 
                                    count + result.findings.filter(f => f.status === 'failed').length, 0)}</span>
                                <span class="stat-label">Règles non respectées</span>
                            </div>
                            <div class="result-stat">
                                <span class="stat-value">${Array.from(this._analysisResults.values()).reduce((count, result) => 
                                    count + result.syntaxErrors.length, 0)}</span>
                                <span class="stat-label">Erreurs de syntaxe</span>
                            </div>
                        </div>
                        <div class="results-details">
                            <ul class="file-results-list">
                                ${Array.from(this._analysisResults.entries()).map(([filePath, result]) => `
                                    <li class="file-result">
                                        <div class="file-header">
                                            <h3>${path.basename(filePath)}</h3>
                                            <span class="file-path">${filePath}</span>
                                        </div>
                                        
                                        ${result.syntaxErrors.length > 0 
                                        ? `
                                            <div class="syntax-errors">
                                                <h4>Erreurs de syntaxe</h4>
                                                <ul class="error-list">
                                                    ${result.syntaxErrors.map(error => `
                                                        <li class="error-item">
                                                            <div class="error-location">Ligne ${error.line}, Colonne ${error.column}</div>
                                                            <div class="error-message">${error.message}</div>
                                                            ${error.code 
                                                            ? `<pre class="error-code">${error.code}</pre>` 
                                                            : ''}
                                                        </li>
                                                    `).join('')}
                                                </ul>
                                            </div>
                                        ` 
                                        : ''}
                                        
                                        <div class="findings">
                                            <h4>Constats d'analyse</h4>
                                            <ul class="findings-list">
                                                ${result.findings.map(finding => `
                                                    <li class="finding-item ${finding.status}">
                                                        <div class="finding-status ${finding.status}">
                                                            ${finding.status === 'passed' ? '✓' : 
                                                              finding.status === 'failed' ? '✗' : 
                                                              finding.status === 'warning' ? '⚠' : 'ℹ'}
                                                        </div>
                                                        <div class="finding-details">
                                                            <div class="finding-rule">${finding.ruleId}</div>
                                                            <div class="finding-description">${finding.description}</div>
                                                            ${finding.message 
                                                            ? `<div class="finding-message">${finding.message}</div>` 
                                                            : ''}
                                                        </div>
                                                    </li>
                                                `).join('')}
                                            </ul>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `
                : '';
            
            // Préparer les remplacements pour le HTML
            const replacements = {
                stylePlaceholder: `<link rel="stylesheet" href="${styleUri}">`,
                detectButtonPlaceholder: detectButtonHtml,
                zipListPlaceholder: zipListHtml,
                javaFilesPlaceholder: javaFilesHtml,
                configSelectorPlaceholder: configSelectorHtml,
                analysisResultsPlaceholder: analysisResultsHtml,
                statsPlaceholder: statsHtml,
                progressPercentage: progressPercentage.toString(),
                detectionPhaseClass: detectionPhaseClass,
                extractionPhaseClass: extractionPhaseClass,
                analysisPhaseClass: analysisPhaseClass,
                resultsPhaseClass: resultsPhaseClass
            };
            
            // Obtenir le contenu HTML avec les remplacements
            const htmlContent = await ResourceUtils.getFileContent(
                this._panel.webview,
                this._extensionUri,
                'src/webview/welcome.html',
                replacements
            );
            
            return htmlContent;
        } catch (error) {
            console.error('Erreur lors de la génération du webview:', error);
            return this._getFallbackContent();
        }
    }
    
    private _getFallbackContent() {
        // Contenu HTML de secours en cas d'erreur de lecture des fichiers
        return `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>TeachAssist</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        color: var(--vscode-foreground);
                        text-align: center;
                    }
                    .error {
                        color: var(--vscode-errorForeground);
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <h1>TeachAssist</h1>
                <div class="error">
                    <p>Une erreur est survenue lors du chargement de l'interface.</p>
                    <p>Veuillez réessayer ou contacter le support.</p>
                </div>
            </body>
            </html>
        `;
    }

    public dispose() {
        WelcomePanel.currentPanel = undefined;
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
} 