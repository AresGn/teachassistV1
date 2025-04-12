import * as vscode from 'vscode';
import * as path from 'path';
import { StudentZip } from '../zipDetector';

export class WelcomePanel {
    public static currentPanel: WelcomePanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _zipFiles: StudentZip[] = [];
    private _javaFiles: Map<string, string[]> = new Map();

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent();
        
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
                }
            },
            null,
            this._disposables
        );
    }

    public static render(extensionUri: vscode.Uri) {
        if (WelcomePanel.currentPanel) {
            WelcomePanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'teachassistWelcome',
            'TeachAssist - Bienvenue',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        WelcomePanel.currentPanel = new WelcomePanel(panel, extensionUri);
    }

    public updateZipList(zipFiles: StudentZip[]) {
        this._zipFiles = zipFiles;
        this._panel.webview.html = this._getWebviewContent();
    }

    public updateJavaFiles(javaFiles: Map<string, string[]>) {
        this._javaFiles = javaFiles;
        this._panel.webview.html = this._getWebviewContent();
    }

    private _getWebviewContent() {
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
                    }
                    .welcome-container {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        font-size: 2em;
                        margin-bottom: 20px;
                    }
                    .button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        cursor: pointer;
                        border-radius: 4px;
                        margin: 10px 0;
                    }
                    .button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .zip-list, .java-files {
                        margin-top: 30px;
                        padding: 20px;
                        background-color: var(--vscode-editor-background);
                        border-radius: 8px;
                    }
                    .zip-list ul, .java-files ul {
                        list-style: none;
                        padding: 0;
                    }
                    .zip-list li, .java-files li {
                        padding: 10px;
                        margin: 5px 0;
                        background-color: var(--vscode-list-activeSelectionBackground);
                        border-radius: 4px;
                    }
                    .zip-list small, .java-files small {
                        color: var(--vscode-descriptionForeground);
                    }
                    .nested-files {
                        margin-left: 20px;
                        margin-top: 5px;
                    }
                    .nested-files li {
                        background-color: var(--vscode-list-inactiveSelectionBackground);
                        padding: 5px 10px;
                        margin: 2px 0;
                    }
                    .phase-indicator {
                        display: flex;
                        justify-content: center;
                        margin: 20px 0;
                    }
                    .phase {
                        padding: 5px 15px;
                        margin: 0 5px;
                        border-radius: 15px;
                        background-color: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                    }
                    .phase.active {
                        background-color: var(--vscode-button-background);
                    }
                    .no-files {
                        border-left: 3px solid var(--vscode-editorError-foreground);
                    }
                    .warning {
                        color: var(--vscode-editorWarning-foreground);
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="welcome-container">
                    <div class="logo">📚 TeachAssist</div>
                    <h2>Assistant de correction automatique</h2>
                    <p>Bienvenue ! Cet outil vous aide à corriger automatiquement les travaux de vos étudiants.</p>
                    
                    <div class="phase-indicator">
                        <span class="phase ${!this._zipFiles.length ? 'active' : ''}">1. Détection</span>
                        <span class="phase ${this._zipFiles.length && !this._javaFiles.size ? 'active' : ''}">2. Extraction</span>
                        <span class="phase">3. Analyse</span>
                        <span class="phase">4. Résultats</span>
                    </div>

                    ${!this._zipFiles.length ? '<button class="button" onclick="detectZip()">Détecter les fichiers ZIP</button>' : ''}
                </div>
                ${zipListHtml}
                ${javaFilesHtml}
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function detectZip() {
                        vscode.postMessage({
                            command: 'detectZip'
                        });
                    }

                    function extractAndLocate() {
                        vscode.postMessage({
                            command: 'extractAndLocate'
                        });
                    }

                    function analyzeCode() {
                        vscode.postMessage({
                            command: 'analyzeCode'
                        });
                    }
                </script>
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