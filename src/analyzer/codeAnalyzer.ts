// Déclaration des types sans import direct
let parse: any;
let BaseJavaCstVisitorWithDefaults: any;

import { ExerciseAnalysisFindings, FindingDetail, SyntaxErrorDetail } from './types';
import { loadExerciseConfig } from './exerciseConfigLoader';

/**
 * Chargement dynamique des dépendances java-parser
 */
async function loadDependencies() {
    const javaParser = await import('java-parser');
    parse = javaParser.parse;
    BaseJavaCstVisitorWithDefaults = javaParser.BaseJavaCstVisitorWithDefaults;
}

/**
 * Analyseur de code Java
 * Utilise java-parser pour générer un arbre syntaxique concret (CST)
 * et analyser le code soumis selon des règles définies.
 */
export class CodeAnalyzer {
    private exerciseId: string;
    private findings: FindingDetail[] = [];
    private syntaxErrors: SyntaxErrorDetail[] = [];
    private parserVersion: string;

    /**
     * Crée une nouvelle instance de CodeAnalyzer
     * @param exerciseId Identifiant de l'exercice
     */
    constructor(exerciseId: string) {
        this.exerciseId = exerciseId;
        this.parserVersion = "2.3.3"; // Version fixe pour l'instant
    }

    /**
     * Analyse un code Java selon les règles de l'exercice
     * @param code Code Java à analyser
     * @returns Résultats de l'analyse
     */
    async analyze(code: string): Promise<ExerciseAnalysisFindings> {
        // Chargement dynamique de java-parser
        await loadDependencies();
        
        this.findings = [];
        this.syntaxErrors = [];

        try {
            // Chargement de la configuration de l'exercice
            const config = await loadExerciseConfig(this.exerciseId);
            
            try {
                // Parsing du code Java
                const cst = parse(code);
                
                // Analyse du CST (à implémenter dans les futures itérations)
                await this.analyzeCst(cst, config);
                
            } catch (error) {
                // Gestion des erreurs de syntaxe
                this.handleParseError(error, code);
            }

            // Construction du résultat
            return {
                exerciseId: this.exerciseId,
                findings: this.findings,
                syntaxErrors: this.syntaxErrors,
                metadata: {
                    analysisDate: new Date().toISOString(),
                    parserVersion: this.parserVersion
                }
            };
        } catch (error) {
            // En cas d'erreur de chargement de configuration ou autre
            this.findings.push({
                ruleId: 'system.error',
                description: 'Une erreur système est survenue lors de l\'analyse',
                status: 'warning', // Utiliser 'warning' au lieu de 'error' pour respecter le type
                message: error instanceof Error ? error.message : String(error)
            });
            
            return {
                exerciseId: this.exerciseId,
                findings: this.findings,
                syntaxErrors: this.syntaxErrors,
                metadata: {
                    analysisDate: new Date().toISOString(),
                    parserVersion: this.parserVersion
                }
            };
        }
    }

    /**
     * Analyse l'arbre syntaxique concret
     * À développer dans les futures itérations
     */
    private async analyzeCst(cst: any, config: any): Promise<void> {
        // Dans cette première itération, nous vérifions uniquement 
        // si le parsing s'est bien déroulé (pas d'erreurs de syntaxe)
        this.findings.push({
            ruleId: 'syntax.valid',
            description: 'Syntaxe Java valide',
            status: 'passed',
            message: 'Le code a été parsé sans erreurs de syntaxe'
        });

        // Les règles d'analyse plus avancées seront implémentées 
        // dans les prochaines itérations
    }

    /**
     * Gère les erreurs de parsing
     * @param error Erreur de parsing
     * @param code Code source
     */
    private handleParseError(error: any, code: string): void {
        if (error && typeof error === 'object' && 'message' in error) {
            const errorMsg = error.message as string;
            
            // Tentative d'extraction de la ligne et colonne
            const locationMatch = errorMsg.match(/line:(\d+),col:(\d+)/i);
            
            if (locationMatch) {
                const line = parseInt(locationMatch[1], 10);
                const column = parseInt(locationMatch[2], 10);
                
                // Extraire le code problématique
                const codeLines = code.split('\n');
                const problematicLine = line <= codeLines.length ? codeLines[line - 1] : '';
                
                this.syntaxErrors.push({
                    line,
                    column,
                    message: this.formatErrorMessage(errorMsg),
                    code: problematicLine.trim()
                });
            } else {
                // Si on ne peut pas extraire la position précise
                this.syntaxErrors.push({
                    line: 0,
                    column: 0,
                    message: this.formatErrorMessage(errorMsg)
                });
            }
        } else {
            // Erreur inconnue
            this.syntaxErrors.push({
                line: 0,
                column: 0,
                message: 'Erreur de syntaxe inconnue'
            });
        }
    }

    /**
     * Formate le message d'erreur pour le rendre plus lisible
     * @param errorMsg Message d'erreur original
     * @returns Message formaté
     */
    private formatErrorMessage(errorMsg: string): string {
        // Simplification des messages d'erreur de java-parser
        let formattedMsg = errorMsg;
        
        // Supprimer les détails techniques du message
        formattedMsg = formattedMsg.replace(/^Error: /, '');
        formattedMsg = formattedMsg.replace(/\bMismatch.*?Expected:/, 'Attendu:');
        formattedMsg = formattedMsg.replace(/\bbut found:/, 'mais trouvé:');
        
        // Traduction des erreurs communes
        if (formattedMsg.includes('semicolon')) {
            formattedMsg = 'Point-virgule manquant';
        } else if (formattedMsg.includes('curly brace')) {
            formattedMsg = 'Accolade manquante ou mal placée';
        } else if (formattedMsg.includes('identifier')) {
            formattedMsg = 'Identifiant invalide ou manquant';
        }
        
        return formattedMsg;
    }
} 