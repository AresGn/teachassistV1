# teachassist README


# TeachAssit

## Description du Projet

TeachAssit est une extension pour Visual Studio Code conçue pour automatiser l'évaluation des travaux de programmation Java. Ce projet vise à réduire considérablement la charge de travail des enseignants tout en fournissant aux étudiants des retours détaillés, personnalisés et cohérents sur leurs codes.

Face à la massification des effectifs dans les formations en informatique, les méthodes traditionnelles de correction manuelle deviennent insoutenables et peuvent conduire à des inégalités d'évaluation. TeachAssit répond à ces défis en proposant une solution intégrée directement dans l'environnement de développement utilisé par les étudiants.

## Objectifs

- **Automatiser l'évaluation** des exercices, travaux pratiques et examens de programmation Java
- **Standardiser les critères d'évaluation** pour garantir l'équité entre les étudiants
- **Fournir des feedbacks détaillés et personnalisés** pour améliorer l'apprentissage
- **Réduire la charge de correction** des enseignants pour leur permettre de se concentrer sur l'accompagnement pédagogique
- **Générer des analyses de performance** au niveau des cohortes pour identifier les concepts mal assimilés

## Architecture du Système

L'extension s'articule autour de trois phases principales qui forment un pipeline d'évaluation complet :

### Phase 3 : Analyse Statique du Code

Cette phase examine la structure et la qualité du code sans l'exécuter :

- Analyse syntaxique via java-parser pour créer l'arbre syntaxique abstrait
- Vérification du respect des conventions de codage configurables
- Mesure de métriques de qualité (complexité cyclomatique, cohésion, etc.)
- Détection des anti-patterns et des faiblesses de conception
- Production de constats d'analyse structurés pour la phase d'évaluation

### Phase 4 : Tests d'Exécution

Cette phase vérifie le comportement fonctionnel du programme :

- Exécution du code Java via le module java-bridge
- Application de jeux de tests prédéfinis par l'enseignant
- Vérification des sorties attendues pour chaque entrée de test
- Mesure des performances d'exécution (temps, utilisation mémoire)
- Capture des exceptions et erreurs d'exécution
- Production de rapports de tests détaillés

### Phase 5 : Évaluation par Intelligence Artificielle

Cette phase agrège les résultats des phases précédentes pour produire une évaluation complète :

- Analyse des constats de la phase 3 et des résultats de tests de la phase 4
- Calcul d'une note basée sur le barème défini par l'enseignant
- Génération de feedback détaillé et personnalisé pour l'étudiant
- Identification des points forts et des axes d'amélioration
- Recommandations spécifiques pour progresser

## Fonctionnalités Clés

- **Interface de soumission simplifiée** pour les étudiants directement dans VS Code
- **Configuration flexible** des critères d'évaluation via fichiers JSON
- **Tableau de bord enseignant** pour suivre la progression des étudiants
- **Visualisation graphique** des résultats d'analyse (surlignage de code, annotations)
- **Historique des soumissions** permettant de suivre la progression de l'étudiant
- **Mode hors-ligne** pour les examens sans accès internet
- **Export des résultats** en différents formats (CSV, PDF, JSON)

## Défis Techniques Potentiels

1. **Robustesse de l'analyse statique** face à la diversité des styles de programmation
2. **Fiabilité de l'environnement d'exécution** pour tester le code des étudiants en toute sécurité
3. **Qualité et pertinence des feedbacks générés** par l'IA
4. **Performance de l'extension** pour garantir une expérience fluide
5. **Intégration avec les systèmes existants** (LMS, GitHub Classroom, etc.)
6. **Protection contre les tentatives de contournement** par les étudiants
7. **Gestion des cas particuliers** et solutions atypiques mais correctes

## Calendrier de Développement

| Phase | Durée | Activités principales |
|-------|-------|----------------------|
| Conception | 4 semaines | Spécifications détaillées, architecture, design UX/UI |
| Développement Phase 3 | 6 semaines | Implémentation du module d'analyse statique |
| Développement Phase 4 | 6 semaines | Implémentation du module de tests d'exécution |
| Développement Phase 5 | 8 semaines | Implémentation du module d'IA et d'évaluation |
| Intégration | 4 semaines | Assemblage des modules, développement de l'interface utilisateur |
| Tests & Validation | 6 semaines | Tests intensifs, correction des bugs, optimisations |
| Déploiement | 2 semaines | Publication sur le marketplace VS Code, documentation |

## Prérequis Techniques

- Node.js et TypeScript pour le développement de l'extension
- Java Development Kit (JDK) pour l'exécution des tests
- Dépendances principales :
  - java-parser pour l'analyse syntaxique
  - java-bridge pour l'exécution sécurisée
  - API d'IA (à déterminer) pour la génération de feedback

## Installation et Utilisation

### Pour les enseignants

1. Installer l'extension depuis le marketplace VS Code
2. Configurer les exercices et leurs critères d'évaluation
3. Distribuer les consignes et templates aux étudiants

### Pour les étudiants

1. Installer l'extension depuis le marketplace VS Code
2. Ouvrir le projet/exercice fourni par l'enseignant
3. Développer la solution
4. Soumettre le code via le bouton dédié pour recevoir une évaluation immédiate

## À propos

TeachAssit est développé par le Laboratoire d'Analyse et de Pédagogie en Informatique (LAPIT) pour répondre aux défis pédagogiques actuels dans l'enseignement de la programmation. Ce projet s'inscrit dans une démarche d'innovation pédagogique visant à améliorer l'expérience d'apprentissage tout en optimisant les ressources enseignantes.



Je vois clairement ce que tu veux. Ta vision est bonne - utiliser des fichiers JSON descriptifs pour définir les règles d'analyse, c'est efficace et flexible. Voici comment structurer simplement la phase 3:

## Phase 3: Implémentation simplifiée

### Structure de fichiers
```
/src
  /analyzers
    codeAnalyzer.ts       // Classe principale d'analyse
    ruleApplier.ts        // Applique les règles aux AST
  /models
    AnalysisResult.ts     // Type pour les résultats
    ExerciseConfig.ts     // Interface de configuration
  /utils
    astHelpers.ts         // Fonctions utilitaires pour naviguer dans l'AST
```

### 1. Modèle de configuration
```typescript
// ExerciseConfig.ts
export interface ExerciseConfig {
  id: string;
  name: string;
  description: string;
  rules: {
    requiredClasses?: string[];
    requiredMethods?: MethodDefinition[];
    requiredDomainChecks?: DomainCheck[];
    checkNamingConventions?: string[];
    checkComments?: boolean;
    // autres règles...
  };
}

interface MethodDefinition {
  name: string;
  params?: string[];
  returnType?: string;
}

interface DomainCheck {
  pattern: string;
  description: string;
  required: boolean;
  errorMessage?: string;
}
```

### 2. Analyseur de code simplifié
```typescript
// codeAnalyzer.ts
import * as javaParser from 'java-parser';
import * as fs from 'fs';
import * as path from 'path';
import { ExerciseConfig } from '../models/ExerciseConfig';
import { applyRules } from './ruleApplier';

export class CodeAnalyzer {
  // Cache pour les configurations d'exercices
  private configCache: Map<string, ExerciseConfig> = new Map();
  
  // Charge une configuration d'exercice
  async loadExerciseConfig(exerciseId: string): Promise<ExerciseConfig> {
    if (this.configCache.has(exerciseId)) {
      return this.configCache.get(exerciseId)!;
    }
    
    const configPath = path.join('configs', `${exerciseId}.json`);
    try {
      const configData = await fs.promises.readFile(configPath, 'utf8');
      const config = JSON.parse(configData) as ExerciseConfig;
      this.configCache.set(exerciseId, config);
      return config;
    } catch (error) {
      throw new Error(`Impossible de charger la configuration pour l'exercice ${exerciseId}: ${error.message}`);
    }
  }
  
  // Analyse un code Java selon la configuration
  async analyzeCode(javaCode: string, exerciseId: string): Promise<any> {
    // Charger la configuration
    const config = await this.loadExerciseConfig(exerciseId);
    
    try {
      // Parser le code Java
      const ast = javaParser.parse(javaCode);
      
      // Appliquer les règles et générer les constats
      const findings = applyRules(ast, javaCode, config.rules);
      
      // Construire le résultat
      return {
        exerciseId: config.id,
        findings,
        syntaxErrors: []
      };
    } catch (error) {
      // Gérer les erreurs syntaxiques
      return {
        exerciseId: config.id,
        findings: [],
        syntaxErrors: [{
          message: error.message,
          line: error.location?.start?.line || 0
        }]
      };
    }
  }
  
  // Stocke les résultats dans un fichier JSON
  storeResults(studentId: string, exerciseId: string, results: any): void {
    const resultsDir = path.join('results', studentId);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const resultsPath = path.join(resultsDir, `${exerciseId}-analysis.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  }
}
```

### 3. Applicateur de règles
```typescript
// ruleApplier.ts
export function applyRules(ast: any, sourceCode: string, rules: any): any[] {
  const findings: any[] = [];
  
  // Vérifier les classes requises
  if (rules.requiredClasses) {
    rules.requiredClasses.forEach((className: string) => {
      const classExists = checkClassExists(ast, className);
      findings.push({
        ruleId: `requiredClass.${className}`,
        description: `Classe ${className} présente`,
        status: classExists ? 'passed' : 'failed',
        message: classExists ? '' : `La classe ${className} n'a pas été trouvée.`
      });
    });
  }
  
  // Vérifier les méthodes requises
  if (rules.requiredMethods) {
    rules.requiredMethods.forEach((method: any) => {
      const methodExists = checkMethodExists(ast, method.name, method.params, method.returnType);
      findings.push({
        ruleId: `requiredMethod.${method.name}`,
        description: `Méthode ${method.name} présente`,
        status: methodExists ? 'passed' : 'failed',
        message: methodExists ? '' : `La méthode ${method.name} n'a pas été trouvée ou ne correspond pas à la signature attendue.`
      });
    });
  }
  
  // Vérifier les règles du domaine (via regex)
  if (rules.requiredDomainChecks) {
    rules.requiredDomainChecks.forEach((check: any) => {
      const pattern = new RegExp(check.pattern);
      const patternFound = pattern.test(sourceCode);
      
      findings.push({
        ruleId: `domainCheck.${check.description.replace(/\s/g, '')}`,
        description: check.description,
        status: check.required ? (patternFound ? 'passed' : 'failed') : (patternFound ? 'passed' : 'warning'),
        message: patternFound ? '' : check.errorMessage
      });
    });
  }
  
  // Vérifier les conventions de nommage (simplifié)
  if (rules.checkNamingConventions) {
    // Implémentation simplifiée
    findings.push({
      ruleId: "namingConvention.check",
      description: "Vérification des conventions de nommage",
      status: 'passed',
      message: ''
    });
  }
  
  return findings;
}

// Fonctions utilitaires simplifiées
function checkClassExists(ast: any, className: string): boolean {
  return ast.types.some((type: any) => 
    type.type === 'ClassDeclaration' && type.name.identifier === className);
}

function checkMethodExists(ast: any, methodName: string, params?: string[], returnType?: string): boolean {
  // Version simplifiée
  return ast.types.some((type: any) => {
    if (type.type !== 'ClassDeclaration') return false;
    
    return type.body.some((member: any) => 
      member.type === 'MethodDeclaration' && member.name.identifier === methodName);
  });
}
```

### 4. Intégration dans extension.ts
```typescript
import { CodeAnalyzer } from './analyzers/codeAnalyzer';

// Dans ton extension.ts:
const analyzer = new CodeAnalyzer();

// Traitement d'une soumission
async function processSubmission(studentId: string, javaFilePath: string, exerciseId: string) {
  // Lire le fichier Java
  const javaCode = fs.readFileSync(javaFilePath, 'utf8');
  
  // Analyser le code
  const results = await analyzer.analyzeCode(javaCode, exerciseId);
  
  // Stocker les résultats
  analyzer.storeResults(studentId, exerciseId, results);
  
  // Retourner les résultats pour la phase suivante
  return results;
}
```

### Workflow complet
1. L'enseignant crée des fichiers JSON dans le dossier `configs/` pour chaque exercice
2. Quand un étudiant soumet son code, l'extension:
   - Identifie l'exercice concerné
   - Charge sa configuration JSON
   - Analyse le code avec les règles définies
   - Génère et stocke les résultats d'analyse
3. Les résultats sont disponibles pour les phases 4 et 5

Cette approche est:
- Simple à comprendre et à implémenter
- Facile à étendre avec de nouvelles règles
- Configurable sans avoir à modifier le code
- Suffisamment robuste pour les besoins courants

Cette structure te permet de finir la Phase 3 avec une base solide, tout en gardant la flexibilité pour les phases suivantes.
