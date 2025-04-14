/**
 * Types et interfaces pour l'analyseur de code Java
 */

/**
 * Détail d'un constat d'analyse
 */
export interface FindingDetail {
    ruleId: string;           // Identifiant unique de la règle
    description: string;      // Description du constat
    status: 'passed' | 'failed' | 'warning' | 'info';
    message?: string;        // Message détaillé optionnel
    location?: {            // Information de localisation
        line: number;
        column: number;
    };
}

/**
 * Détail d'une erreur de syntaxe
 */
export interface SyntaxErrorDetail {
    line: number;
    column: number;
    message: string;
    code?: string;         // Extrait du code problématique
}

/**
 * Résultats de l'analyse d'un exercice
 */
export interface ExerciseAnalysisFindings {
    exerciseId: string;
    findings: FindingDetail[];
    syntaxErrors: SyntaxErrorDetail[];
    metadata?: {
        analysisDate: string;
        parserVersion: string;
    };
}

/**
 * Détail d'une règle pour l'exercice
 */
export interface ExerciseRuleDetail {
    pattern?: string;       // Expression régulière pour détecter des motifs spécifiques
    description: string;    // Description de la règle ou du motif recherché
    required?: boolean;     // Le motif/règle est-il obligatoire ?
    errorMessage?: string;  // Message d'erreur si la règle n'est pas respectée
}

/**
 * Configuration d'un exercice
 */
export interface ExerciseConfig {
    id: string;                   // Identifiant unique de l'exercice
    name: string;                 // Nom lisible de l'exercice
    description: string;          // Description détaillée de ce que l'étudiant doit accomplir
    rules: {
        // Configuration initiale minimale
        requiredClasses?: string[];       // Noms des classes obligatoires
        requiredMethods?: {              
            name: string;
            params?: string[];           // Types des paramètres
            returnType?: string;         // Type de retour
        }[];
        disallowedElements?: string[];    // Éléments de syntaxe interdits
        checkVariableScope?: boolean;     // Vérification de la portée des variables
        checkMethodLength?: number;       // Longueur maximale recommandée pour une méthode
        checkCyclomaticComplexity?: number; // Seuil de complexité cyclomatique
        
        // Autres règles qui seront implémentées dans les itérations suivantes
    };
}

/**
 * Exercice dans une évaluation
 */
export interface AssessmentExercise {
    exerciseId: string;    // Référence à un ExerciseConfig
    maxPoints?: number;    // Points maximums attribués à cet exercice dans l'évaluation
}

/**
 * Configuration d'une évaluation
 */
export interface AssessmentConfig {
    assessmentId: string;  // Identifiant unique de l'évaluation
    name: string;          // Nom lisible
    exercises: AssessmentExercise[]; // Liste des exercices inclus
    totalMaxPoints?: number; // Points totaux maximums
} 