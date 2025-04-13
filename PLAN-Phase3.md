# Plan d'Implémentation Itératif - Phase 3 : Analyse Statique du Code Java

Ce document détaille les étapes itératives pour implémenter l'analyseur statique de code Java (Phase 3) décrit dans `PLAN_CODE-ANALYSER.md`. Chaque itération se concentre sur un ensemble spécifique de fonctionnalités et inclut des étapes de test.

**Objectif Final:** Un analyseur capable de traiter des soumissions d'évaluations complètes, d'analyser chaque fichier Java selon une configuration d'exercice spécifique (`ExerciseConfig`), et de produire un rapport structuré des constats (`AssessmentAnalysisFindings`) sans effectuer d'évaluation ni de notation (réservé à la Phase 5).

---

## Itération 1 : Setup de Base et Parsing Initial

**Objectif:** Mettre en place la structure de base, intégrer le parser Java et gérer les erreurs de syntaxe fondamentales.

**Étapes d'implémentation :**

1.  **Structure du Projet :**
    *   Créer les dossiers nécessaires (ex: `src/analyzer`, `configs/exercises`, `configs/assessments`, `test/fixtures`).
    *   Installer la dépendance `java-parser`.
2.  **Définir les Interfaces Initiales :**
    *   Dans `src/analyzer/types.ts` (ou similaire), définir les interfaces de base :
        *   `FindingDetail`: Pour représenter un constat individuel (avec `ruleId`, `description`, `status`, `message?`).
        *   `SyntaxErrorDetail`: Pour les erreurs de parsing (`line`, `column`, `message`).
        *   `ExerciseAnalysisFindings`: Structure initiale pour les résultats d'un exercice (`exerciseId`, `findings: FindingDetail[]`, `syntaxErrors: SyntaxErrorDetail[]`).
        *   `ExerciseConfig`: Structure minimale initiale (`id`, `name`, `description`, `rules: {}`).
3.  **Chargeur de Configuration Simple (`exerciseConfigLoader.ts`) :**
    *   Créer `src/analyzer/exerciseConfigLoader.ts`.
    *   Implémenter une fonction `loadExerciseConfig(exerciseId: string): Promise<ExerciseConfig>` qui lit un fichier JSON simple depuis `configs/exercises/${exerciseId}.json`.
    *   Gérer les erreurs de base (fichier non trouvé, JSON invalide).
4.  **Squelette de `CodeAnalyzer` (`codeAnalyzer.ts`) :**
    *   Créer `src/analyzer/codeAnalyzer.ts`.
    *   Définir la classe `CodeAnalyzer` avec un constructeur prenant `exerciseId`.
    *   Ajouter une méthode `async analyze(javaCode: string): Promise<ExerciseAnalysisFindings>`.
    *   Dans le constructeur ou au début de `analyze`, appeler `loadExerciseConfig` pour charger la configuration.
5.  **Intégration du Parser Java :**
    *   Dans la méthode `analyze` de `CodeAnalyzer`:
        *   Utiliser `java-parser` pour parser `javaCode`.
        *   Implémenter un `try...catch` autour du parsing.
        *   En cas d'erreur de parsing, extraire les informations pertinentes (ligne, colonne, message) et peupler le tableau `syntaxErrors` dans l'objet `ExerciseAnalysisFindings` retourné.
        *   Si le parsing réussit, retourner un objet `ExerciseAnalysisFindings` avec un tableau `syntaxErrors` vide pour l'instant.

**Tests (Itération 1) :**

*   **T1.1 (Config):** Créer un fichier `configs/exercises/test-basic.json` simple. Vérifier que `loadExerciseConfig('test-basic')` le charge correctement et échoue pour un ID inexistant.
*   **T1.2 (Parsing OK):** Créer un fichier Java minimaliste valide (`HelloWorld.java`). Appeler `analyzer.analyze()` avec son contenu et la config `test-basic`. Vérifier que l'objet retourné a `syntaxErrors` vide.
*   **T1.3 (Parsing KO):** Créer un fichier Java avec une erreur de syntaxe évidente (ex: point-virgule manquant). Appeler `analyzer.analyze()`. Vérifier que l'objet retourné contient au moins une `SyntaxErrorDetail` avec des informations approximativement correctes.

---

## Itération 2 : Implémentation Règles Simples (Éléments Requis)

**Objectif:** Ajouter la capacité de vérifier la présence d'éléments structurels de base (classes, méthodes) définis dans la configuration.

**Étapes d'implémentation :**

1.  **Étendre `ExerciseConfig` :**
    *   Dans `src/analyzer/types.ts`, ajouter les champs optionnels à `ExerciseConfig.rules`:
        *   `requiredClasses?: string[]`
        *   `requiredMethods?: { name: string; params?: string[]; returnType?: string; }[]`
2.  **Logique d'Analyse dans `CodeAnalyzer` :**
    *   Si le parsing réussit (CST disponible) :
        *   Parcourir le CST pour identifier les déclarations de classes.
        *   Si `config.rules.requiredClasses` existe, vérifier si toutes les classes listées sont présentes. Pour chaque classe requise, ajouter un `FindingDetail` au tableau `findings` avec `status: 'passed'` ou `'failed'`. Utiliser un `ruleId` descriptif (ex: `requiredClass.ClassName`).
        *   Parcourir le CST pour identifier les déclarations de méthodes dans les classes appropriées.
        *   Si `config.rules.requiredMethods` existe, vérifier si toutes les méthodes listées (avec correspondance de nom simple pour l'instant) sont présentes. Pour chaque méthode requise, ajouter un `FindingDetail` (`passed`/`failed`) avec un `ruleId` (ex: `requiredMethod.methodName`).
        *   (Optionnel avancé): Commencer à vérifier les types de paramètres/retour si spécifiés dans la config.
3.  **Adapter le Retour :**
    *   S'assurer que la méthode `analyze` retourne l'objet `ExerciseAnalysisFindings` contenant à la fois les `syntaxErrors` (si applicable) et les `findings` générés par ces nouvelles règles.

**Tests (Itération 2) :**

*   **T2.1 (Config):** Créer une config `configs/exercises/req-class-method.json` avec `requiredClasses: ["Calculator"]` et `requiredMethods: [{ name: "add" }]`.
*   **T2.2 (Tout OK):** Créer `Calculator.java` contenant la classe `Calculator` et la méthode `add()`. Analyser avec `req-class-method`. Vérifier que les `findings` indiquent `passed` pour les deux règles.
*   **T2.3 (Classe Manquante):** Modifier `Calculator.java` (ex: renommer la classe). Analyser. Vérifier `finding` pour `requiredClass.Calculator` est `failed`.
*   **T2.4 (Méthode Manquante):** Remettre la classe correcte mais supprimer/renommer la méthode `add()`. Analyser. Vérifier `finding` pour `requiredMethod.add` est `failed`.
*   **T2.5 (Syntax Error + Rule):** Introduire une erreur de syntaxe *et* manquer une règle (ex: méthode `add`). Analyser. Vérifier que `syntaxErrors` est peuplé *et* que le `finding` pour `requiredMethod.add` est `failed` (ou non évalué si le parsing échoue complètement, à définir).

---

## Itération 3 : Règles Structurelles Additionnelles (Éléments Interdits, Longueur)

**Objectif:** Vérifier l'absence d'éléments de syntaxe interdits et introduire une première métrique simple (longueur de méthode).

**Étapes d'implémentation :**

1.  **Étendre `ExerciseConfig` :**
    *   Dans `src/analyzer/types.ts`, ajouter les champs optionnels à `ExerciseConfig.rules`:
        *   `disallowedElements?: string[]` (ex: `["System.exit", "goto"]`)
        *   `checkMethodLength?: number` (ex: `20` pour max 20 lignes/instructions)
    *   Dans `FindingDetail`, ajouter `metricValue?: number | string;` pour stocker des valeurs comme la longueur.
2.  **Logique d'Analyse dans `CodeAnalyzer` :**
    *   Lors du parcours du CST :
        *   **Éléments Interdits:** Si `config.rules.disallowedElements` existe, identifier les nœuds correspondants à ces éléments (ex: `MethodInvocation` pour `System.exit`, `GotoStatement` pour `goto`). Si un élément interdit est trouvé, ajouter un `FindingDetail` avec `status: 'failed'` et un `ruleId` (ex: `disallowedElement.SystemExit`).
        *   **Longueur des Méthodes:** Si `config.rules.checkMethodLength` est défini :
            *   Identifier les nœuds de déclaration de méthode (`MethodDeclaration`).
            *   Calculer la "longueur" de chaque méthode. *Approche simple :* Différence entre ligne de début et ligne de fin du corps de la méthode. *Approche plus avancée :* Compter le nombre d'instructions si le CST le permet facilement.
            *   Comparer la longueur calculée au seuil `checkMethodLength`.
            *   Ajouter un `FindingDetail` par méthode vérifiée, avec `status: 'info'` (ou `warning`/`failed` si le seuil est dépassé), `ruleId` (ex: `metric.methodLength.methodName`), et `metricValue: calculatedLength`.

**Tests (Itération 3) :**

*   **T3.1 (Config):** Créer `disallowed.json` avec `disallowedElements: ["System.exit"]`. Créer `length.json` avec `checkMethodLength: 15`.
*   **T3.2 (Disallowed OK):** Analyser un code *sans* `System.exit` avec `disallowed.json`. Vérifier qu'aucun finding `disallowedElement.SystemExit` n'est présent (ou qu'il est `passed`, selon l'implémentation).
*   **T3.3 (Disallowed KO):** Analyser un code *avec* `System.exit(0);` avec `disallowed.json`. Vérifier qu'un `FindingDetail` avec `status: 'failed'` et `ruleId: 'disallowedElement.SystemExit'` est généré.
*   **T3.4 (Length OK):** Analyser un code avec une méthode de 10 lignes avec `length.json`. Vérifier le `FindingDetail` pour la longueur de cette méthode (ex: `status: 'info'`, `metricValue: 10`).
*   **T3.5 (Length KO):** Analyser un code avec une méthode de 25 lignes avec `length.json`. Vérifier le `FindingDetail` (ex: `status: 'warning'` ou `'failed'`, `metricValue: 25`).

---

## Itération 4 : Structures de Contrôle et Opérateurs

**Objectif:** Vérifier l'utilisation des structures de contrôle requises et des opérateurs autorisés.

**Étapes d'implémentation :**

1.  **Étendre `ExerciseConfig` :**
    *   Dans `src/analyzer/types.ts`, ajouter les champs optionnels à `ExerciseConfig.rules`:
        *   `requiredControlStructures?: ("if" | "else" | "switch" | "for" | "while" | "do-while")[]`
        *   `allowedOperators?: string[]` (ex: `["+", "-", "*", "/", "%", "==", "!=", "<", ">", "<=", ">=", "&&", "||", "!"]`)
2.  **Logique d'Analyse dans `CodeAnalyzer` :**
    *   Lors du parcours du CST :
        *   **Structures de Contrôle:** Si `config.rules.requiredControlStructures` existe :
            *   Utiliser un set ou un map pour enregistrer les types de structures de contrôle rencontrées (`IfStatement`, `ForStatement`, `WhileStatement`, etc.).
            *   *Après* le parcours complet, comparer l'ensemble des structures trouvées avec l'ensemble des structures requises.
            *   Pour chaque structure dans `requiredControlStructures`, ajouter un `FindingDetail` avec `status: 'passed'` si elle a été trouvée, et `status: 'failed'` sinon. Utiliser un `ruleId` (ex: `requiredControl.for`, `requiredControl.if`).
        *   **Opérateurs Autorisés:** Si `config.rules.allowedOperators` existe :
            *   Identifier tous les nœuds d'expression utilisant des opérateurs (ex: `BinaryExpression`, `UnaryExpression`).
            *   Extraire le symbole de l'opérateur (ex: `+`, `*`, `&&`, `!`).
            *   Vérifier si cet opérateur est présent dans la liste `allowedOperators`.
            *   Si un opérateur *non autorisé* est trouvé, ajouter un `FindingDetail` avec `status: 'failed'` et un `ruleId` (ex: `disallowedOperator./`). Inclure l'opérateur et potentiellement la ligne dans le message.

**Tests (Itération 4) :**

*   **T4.1 (Config):** Créer `req-struct.json` avec `requiredControlStructures: ["for", "if"]`. Créer `ops.json` avec `allowedOperators: ["+", "-", "=="]`.
*   **T4.2 (Struct OK):** Analyser un code contenant une boucle `for` et une structure `if` avec `req-struct.json`. Vérifier que les findings pour `requiredControl.for` et `requiredControl.if` sont `passed`.
*   **T4.3 (Struct Manquant):** Analyser un code avec `if` mais sans `for` avec `req-struct.json`. Vérifier `finding` pour `for` est `failed`, et pour `if` est `passed`.
*   **T4.4 (Struct Non Requis):** Analyser un code avec `while` (non requis) avec `req-struct.json`. Vérifier qu'aucun finding spécifique n'est généré pour `while` (mais ceux pour `for`/`if` sont `failed` s'ils manquent).
*   **T4.5 (Ops OK):** Analyser un code utilisant seulement `+`, `-`, `==` avec `ops.json`. Vérifier qu'aucun finding `disallowedOperator` n'est généré.
*   **T4.6 (Ops KO):** Analyser un code utilisant `a * b` avec `ops.json`. Vérifier qu'un `FindingDetail` avec `status: 'failed'` et `ruleId: 'disallowedOperator.*'` (ou similaire) est généré.

---

## Itération 5 : Logique Spécifique et Vérifications de Domaine (Patterns)

**Objectif:** Implémenter des vérifications plus fines basées sur des patterns (expressions régulières) pour des logiques métier spécifiques ou des conditions de domaine.

**Étapes d'implémentation :**

1.  **Définir/Affiner les Interfaces :**
    *   Assurer que l'interface `ExerciseRuleDetail` est définie dans `types.ts` (avec `pattern?: string`, `description`, `required?`, `errorMessage?`).
    *   Dans `ExerciseConfig.rules`, ajouter les champs optionnels :
        *   `customPatterns?: ExerciseRuleDetail[]`
        *   `requiredDomainChecks?: ExerciseRuleDetail[]`
        *   `mathFunctions?: { name: string; domainCondition?: ExerciseRuleDetail; implementationPattern?: ExerciseRuleDetail; }[]`
2.  **Logique d'Analyse dans `CodeAnalyzer` (Pattern Matching) :**
    *   Développer une fonction helper (potentiellement dans une classe `CstVisitor` ou similaire) qui peut rechercher un `pattern` (RegExp) dans le texte source ou sur des nœuds spécifiques du CST.
    *   **Custom Patterns:** Si `config.rules.customPatterns` existe:
        *   Pour chaque `ExerciseRuleDetail` dans la liste :
            *   Utiliser le helper pour rechercher le `pattern`.
            *   Si `required` est `true`, générer un finding `failed` si le pattern n'est *pas* trouvé, et `passed` s'il l'est.
            *   Si `required` est `false` (ou absent), on pourrait ne rien faire ou générer un finding `info` si trouvé (à clarifier selon le besoin exact).
            *   Utiliser un `ruleId` unique (ex: `customPattern.uniqueIdForTheRule`).
    *   **Required Domain Checks:** Si `config.rules.requiredDomainChecks` existe:
        *   Fonctionne de manière similaire à `customPatterns`, mais on s'attend généralement à ce que `required` soit `true`. Le but est de vérifier qu'une certaine condition (ex: `x > 0`) est présente *avant* une opération spécifique (ce qui pourrait nécessiter une analyse plus contextuelle dans les itérations futures, mais pour l'instant, on cherche juste le pattern).
        *   Générer des findings `passed`/`failed` avec `ruleId` (ex: `domainCheck.checkName`).
    *   **Math Functions:** Si `config.rules.mathFunctions` existe:
        *   Pour chaque fonction configurée:
            *   Identifier les appels à cette fonction (`MethodInvocation` avec le bon `name`).
            *   Si un `domainCondition` est défini, rechercher son `pattern` dans le bloc de code *précédant* l'appel (peut être simplifié en cherchant dans toute la méthode pour l'instant). Générer un finding `passed`/`failed` pour le `domainCondition` (ex: `math.domainCheck.sqrt.positive`).
            *   Si un `implementationPattern` est défini, vérifier si le code autour de l'appel correspond à ce pattern (peut être complexe, commencer simplement).

**Tests (Itération 5) :**

*   **T5.1 (Config):** Créer `patterns.json` avec `customPatterns: [{ pattern: "montant\s*=\s*0", description: "Initialise montant à 0", required: true }]`. Créer `domain.json` avec `requiredDomainChecks: [{ pattern: "valeur\s*>\s*0", description: "Vérifie valeur positive", required: true }]`.
*   **T5.2 (Custom Pattern OK/KO):** Analyser du code avec et sans `montant = 0;` en utilisant `patterns.json`. Vérifier le statut `passed`/`failed` du finding `customPattern.uniqueIdForTheRule`.
*   **T5.3 (Domain Check OK/KO):** Analyser du code avec et sans `if (valeur > 0)` (ou similaire) en utilisant `domain.json`. Vérifier le statut `passed`/`failed` du finding `domainCheck.checkName`.
*   **T5.4 (Math Domain):** Configurer une règle pour `Math.log` avec un `domainCondition` dont le pattern est `x\s*>\s*0`. Analyser du code appelant `Math.log(x)` précédé (ou non) par `if (x > 0)`. Vérifier le finding `math.domainCheck.log.positive`.

---

## Itération 6 : Règles Orientées Objet et Gestion des Exceptions

**Objectif:** Implémenter les vérifications liées aux concepts OOP de base et à la gestion des exceptions configurée.

**Étapes d'implémentation :**

1.  **Étendre `ExerciseConfig` :**
    *   Dans `src/analyzer/types.ts`, ajouter les champs optionnels à `ExerciseConfig.rules`:
        *   `exceptionHandling?: { requiredTryCatch?: boolean; specificExceptions?: string[]; requireFinally?: boolean; }`
        *   `oopConcepts?: { inheritanceRequired?: string; interfaceImplementation?: string[]; polymorphismCheck?: boolean; encapsulationCheck?: ("private" | "protected" | "public")[]; }`
2.  **Logique d'Analyse dans `CodeAnalyzer` :**
    *   Lors du parcours du CST :
        *   **Exception Handling:** Si `config.rules.exceptionHandling` est défini :
            *   `requiredTryCatch`: Vérifier la présence d'au moins un `TryStatement`. Générer `passed`/`failed` (`ruleId: exception.requiredTryCatch`).
            *   `requireFinally`: Si `requiredTryCatch` est aussi vrai, vérifier que les `TryStatement` trouvés ont un bloc `finally`. Générer `passed`/`failed` (`ruleId: exception.requiredFinally`).
            *   `specificExceptions`: Identifier les types dans les clauses `CatchClause`. Vérifier si ceux listés sont présents. Générer `passed`/`failed` pour chaque exception requise (`ruleId: exception.catch.ArithmeticException`).
        *   **OOP Concepts:** Si `config.rules.oopConcepts` est défini :
            *   `inheritanceRequired`: Vérifier si la déclaration de classe principale a une clause `extends` correspondant au nom spécifié. Générer `passed`/`failed` (`ruleId: oop.inheritance.ParentClass`).
            *   `interfaceImplementation`: Vérifier si la déclaration de classe a une clause `implements` listant *toutes* les interfaces spécifiées. Générer `passed`/`failed` pour chaque interface (`ruleId: oop.implements.Runnable`).
            *   `encapsulationCheck`: Identifier les déclarations de champs (`FieldDeclaration`) et de méthodes (`MethodDeclaration`). Vérifier si leurs modificateurs (`private`, `protected`, `public`) sont présents dans la liste `encapsulationCheck`. Générer des findings `info` ou `warning` si un modificateur non attendu est trouvé (`ruleId: oop.encapsulation.fieldName`). (Note: la règle exacte - ex: "tous les champs doivent être private" vs "seulement private/protected autorisés" - doit être clarifiée).
            *   `polymorphismCheck`: C'est plus complexe. *Approche simple pour commencer :* Vérifier la présence de méthodes annotées avec `@Override`. Générer un finding `info` ou `passed` (`ruleId: oop.polymorphism.overridePresent`). Une analyse réelle du polymorphisme est significativement plus difficile.

**Tests (Itération 6) :**

*   **T6.1 (Config):** Créer `exceptions.json` (`requiredTryCatch: true`, `specificExceptions: ["IOException"]`). Créer `oop.json` (`inheritanceRequired: "Vehicle"`, `interfaceImplementation: ["Serializable"]`, `encapsulationCheck: ["private"]`).
*   **T6.2 (TryCatch OK/KO):** Analyser code avec/sans bloc `try`. Vérifier `exception.requiredTryCatch`.
*   **T6.3 (Specific Catch OK/KO):** Analyser code avec `try...catch (IOException e)` vs `try...catch (Exception e)`. Vérifier `exception.catch.IOException`.
*   **T6.4 (Inheritance OK/KO):** Analyser `class Car extends Vehicle` vs `class Car`. Vérifier `oop.inheritance.Vehicle`.
*   **T6.5 (Interface OK/KO):** Analyser `class Data implements Serializable` vs `class Data`. Vérifier `oop.implements.Serializable`.
*   **T6.6 (Encapsulation):** Analyser une classe avec `private int count;` et `public int count2;` avec `encapsulationCheck: ["private"]`. Vérifier les findings générés (ex: warning pour `count2`).

---

## Itération 7 : Règles de Style et Qualité (Nommage, Commentaires, Complexité)

**Objectif:** Implémenter des vérifications de style de codage (conventions de nommage, présence de commentaires) et calculer la complexité cyclomatique.

**Étapes d'implémentation :**

1.  **Étendre `ExerciseConfig` :**
    *   Dans `src/analyzer/types.ts`, ajouter les champs optionnels à `ExerciseConfig.rules`:
        *   `checkComments?: boolean`
        *   `checkNamingConventions?: ("camelCase" | "PascalCase" | "UPPER_SNAKE_CASE")[]`
        *   `checkCyclomaticComplexity?: number`
2.  **Logique d'Analyse dans `CodeAnalyzer` :**
    *   Lors du parcours du CST :
        *   **Commentaires:** Si `config.rules.checkComments` est `true`:
            *   Vérifier la présence de commentaires Javadoc (`/** ... */`) associés aux déclarations de classes publiques et méthodes publiques. Générer un finding `passed`/`failed`/`warning` (`ruleId: style.javadoc.ClassName` ou `style.javadoc.methodName`).
            *   (Optionnel) Rechercher les commentaires `// TODO` ou `// FIXME` dans le code source. Générer un finding `info` (`ruleId: info.todo`).
        *   **Conventions de Nommage:** Si `config.rules.checkNamingConventions` est défini :
            *   Identifier les déclarations de classes, méthodes, variables locales, constantes (`static final`).
            *   Pour chaque type d'identifiant, appliquer une vérification par expression régulière simple basée sur les conventions demandées (ex: `^[a-z][a-zA-Z0-9]*$` pour `camelCase`, `^[A-Z][a-zA-Z0-9]*$` pour `PascalCase`, `^[A-Z][A-Z0-9_]*$` pour `UPPER_SNAKE_CASE`).
            *   Générer un finding `passed`/`failed`/`warning` si une convention n'est pas respectée pour un identifiant (`ruleId: style.naming.camelCase.variableName`, `style.naming.PascalCase.ClassName`).
        *   **Complexité Cyclomatique:** Si `config.rules.checkCyclomaticComplexity` est défini :
            *   Identifier les déclarations de méthode.
            *   Calculer la complexité cyclomatique pour chaque méthode. *Approche simple :* Compter 1 (base) + nombre de points de décision (`if`, `for`, `while`, `case`, `&&`, `||`, `? :`, `catch`).
            *   Comparer la complexité calculée au seuil `checkCyclomaticComplexity`.
            *   Ajouter un `FindingDetail` avec `status: 'info'` (ou `warning`/`failed` si seuil dépassé), `ruleId` (ex: `metric.cyclomaticComplexity.methodName`), et `metricValue: calculatedComplexity`.

**Tests (Itération 7) :**

*   **T7.1 (Config):** Créer `style.json` avec `checkComments: true`, `checkNamingConventions: ["camelCase", "PascalCase"]`, `checkCyclomaticComplexity: 5`.
*   **T7.2 (Comments OK/KO):** Analyser code avec/sans Javadoc sur classes/méthodes publiques. Analyser code avec `// TODO`. Vérifier les findings `style.javadoc.*` et `info.todo`.
*   **T7.3 (Naming OK/KO):** Analyser code avec `int myVariable;` et `class MyClass;`. Analyser code avec `int My_Variable;` ou `class myClass;`. Vérifier les findings `style.naming.*`.
*   **T7.4 (Complexity OK/KO):** Analyser une méthode simple (complexité 1), une méthode avec un `if` (complexité 2), une méthode avec `if`/`else if`/`else` et une boucle `for` (complexité > 5). Vérifier les findings `metric.cyclomaticComplexity.*` et les `metricValue` correspondants.

---

## Itération 8 : Configuration et Chargement des Évaluations

**Objectif:** Définir la structure de configuration pour les évaluations complètes (composées de plusieurs exercices) et implémenter le chargement de ces configurations.

**Étapes d'implémentation :**

1.  **Définir les Interfaces (`types.ts`) :**
    *   Créer l'interface `AssessmentExercise`:
        *   `exerciseId: string` (référence à un `ExerciseConfig`)
        *   `maxPoints?: number` (pour info Phase 5)
    *   Créer l'interface `AssessmentConfig`:
        *   `assessmentId: string`
        *   `name: string`
        *   `exercises: AssessmentExercise[]`
        *   `totalMaxPoints?: number` (pour info Phase 5)
2.  **Implémenter le Chargeur (`assessmentConfigLoader.ts`) :**
    *   Créer le fichier `src/analyzer/assessmentConfigLoader.ts`.
    *   Implémenter la fonction `async loadAssessmentConfig(assessmentId: string): Promise<AssessmentConfig>`.
    *   Cette fonction doit lire et parser le fichier JSON depuis un chemin prédéfini (ex: `configs/assessments/${assessmentId}.json`).
    *   Inclure une gestion d'erreurs robuste (fichier non trouvé, JSON invalide, structure non conforme aux interfaces).
3.  **Créer des Exemples de Configuration :**
    *   Créer le dossier `configs/assessments/`.
    *   Créer au moins deux fichiers d'exemple (ex: `td1.json`, `examen-s1.json`) conformes à l'interface `AssessmentConfig` et faisant référence à des `exerciseId` pour lesquels des `ExerciseConfig` existent (ou existeront).

**Tests (Itération 8) :**

*   **T8.1 (Config Valide):** Créer `configs/assessments/test-assessment.json` référençant des `exerciseId` existants (ex: `test-basic`, `req-class-method`). Appeler `loadAssessmentConfig('test-assessment')`. Vérifier que l'objet `AssessmentConfig` retourné est correct.
*   **T8.2 (ID Inexistant):** Appeler `loadAssessmentConfig('invalid-id')`. Vérifier qu'une erreur appropriée (ex: `FileNotFoundError`) est levée ou retournée.
*   **T8.3 (JSON Malformé):** Créer un fichier `malformed.json` dans `configs/assessments/` avec une erreur de syntaxe JSON. Appeler `loadAssessmentConfig('malformed')`. Vérifier qu'une erreur de parsing JSON est levée ou retournée.
*   **T8.4 (Structure Incorrecte):** Créer un fichier `wrong-structure.json` valide en JSON mais ne correspondant pas à l'interface `AssessmentConfig` (ex: champ `exercises` manquant). Appeler `loadAssessmentConfig('wrong-structure')`. Vérifier qu'une erreur de validation de structure est levée ou retournée (peut nécessiter une validation explicite après le parsing).

---

## Itération 9 : Implémentation de `AssessmentAnalyzer`

**Objectif:** Créer la classe qui orchestre l'analyse d'une évaluation complète, en utilisant `CodeAnalyzer` pour chaque exercice inclus et en agrégeant les résultats.

**Étapes d'implémentation :**

1.  **Définir les Interfaces de Sortie (`types.ts`) :**
    *   Créer l'interface `ExerciseFindingsDetail`:
        *   `exerciseId: string`
        *   `maxPoints?: number` (copié depuis `AssessmentConfig`)
        *   `analysis?: ExerciseAnalysisFindings` (le résultat de `CodeAnalyzer`)
        *   `error?: string` (pour les erreurs d'analyse de cet exercice spécifique, ex: fichier Java manquant)
    *   Créer l'interface `AssessmentAnalysisFindings` (sortie finale de la Phase 3) :
        *   `assessmentId: string`
        *   `name: string` (copié depuis `AssessmentConfig`)
        *   `details: ExerciseFindingsDetail[]`
2.  **Créer la Classe `AssessmentAnalyzer` (`assessmentAnalyzer.ts`) :**
    *   Créer `src/analyzer/assessmentAnalyzer.ts`.
    *   Importer les types nécessaires, `loadAssessmentConfig`, `CodeAnalyzer`, et `ExerciseAnalysisFindings`.
    *   Définir la classe `AssessmentAnalyzer` avec un constructeur prenant `assessmentId`.
    *   Ajouter une propriété privée `assessmentConfig: AssessmentConfig`.
    *   Ajouter une méthode privée `async loadConfig(): Promise<void>` qui appelle `loadAssessmentConfig` et stocke le résultat.
3.  **Implémenter la Méthode `analyze` :**
    *   Ajouter une méthode publique `async analyze(files: Map<string, string>): Promise<AssessmentAnalysisFindings>`.
        *   **Note:** L'argument `files` est une Map où la clé est le nom du fichier (ex: `Banques.java`) et la valeur est le contenu du fichier. Une étape précédente (Itération 10) devra préparer cette Map.
    *   Appeler `await this.loadConfig()`.
    *   Initialiser une Map locale pour stocker les `ExerciseFindingsDetail` par `exerciseId`.
    *   Itérer sur `this.assessmentConfig.exercises` :
        *   Pour chaque `exerciseConf` (`{ exerciseId, maxPoints }`) :
            *   Déterminer le nom de fichier Java attendu. *Convention simple :* `exerciseId` transformé en PascalCase + `.java` (ex: `banques` -> `Banques.java`). Cette convention peut être affinée.
            *   Récupérer le contenu du fichier correspondant depuis la Map `files`.
            *   Créer un objet `ExerciseFindingsDetail` initial avec `exerciseId` et `maxPoints`.
            *   Si le contenu du fichier est trouvé :
                *   Instancier `const analyzer = new CodeAnalyzer(exerciseId);`.
                *   Appeler `const exerciseFindings = await analyzer.analyze(fileContent);` dans un `try...catch`.
                *   Si succès, assigner `detail.analysis = exerciseFindings;`.
                *   Si erreur, assigner `detail.error = "Failed to analyze: ...";`.
            *   Si le contenu du fichier n'est *pas* trouvé :
                *   Assigner `detail.error = "File not found: ...";`.
            *   Stocker `detail` dans la Map locale.
4.  **Implémenter la Méthode `aggregateFindings` :**
    *   Ajouter une méthode privée (ou appelée à la fin de `analyze`) `aggregateFindings(resultsMap: Map<string, ExerciseFindingsDetail>): AssessmentAnalysisFindings`.
    *   Créer un tableau `details: ExerciseFindingsDetail[]`.
    *   Itérer à nouveau sur `this.assessmentConfig.exercises` pour garantir l'ordre et l'inclusion de tous les exercices définis dans l'évaluation.
    *   Pour chaque `exerciseConf`, récupérer le `ExerciseFindingsDetail` correspondant depuis `resultsMap`. S'il manque (ce qui ne devrait pas arriver si `analyze` est correct), ajouter une entrée d'erreur par défaut.
    *   Ajouter le détail récupéré (ou l'erreur par défaut) au tableau `details`.
    *   Retourner l'objet final `AssessmentAnalysisFindings` avec `assessmentId`, `name` (de `this.assessmentConfig`), et le tableau `details`.

**Tests (Itération 9) :**

*   **T9.1 (Setup):** Préparer une `AssessmentConfig` (`test-eval.json`) référençant deux `ExerciseConfig` (`ex1.json`, `ex2.json`). Préparer `Ex1.java` (correct pour `ex1.json`) et `Ex2.java` (avec une erreur ou violant une règle de `ex2.json`). Préparer une `Map<string, string>` contenant le contenu de ces deux fichiers.
*   **T9.2 (Analyse OK):** Instancier `const assessmentAnalyzer = new AssessmentAnalyzer('test-eval')`. Appeler `const results = await assessmentAnalyzer.analyze(filesMap);`. Vérifier :
    *   Que `results.assessmentId` et `results.name` sont corrects.
    *   Que `results.details` a une longueur de 2.
    *   Que `results.details[0].exerciseId` est `ex1`, `maxPoints` est correct, `error` est `undefined`, et `analysis` contient les `findings` attendus de `CodeAnalyzer` pour `Ex1.java`.
    *   Que `results.details[1].exerciseId` est `ex2`, `maxPoints` est correct, `error` est `undefined`, et `analysis` contient les `findings` (incluant l'erreur/violation attendue) pour `Ex2.java`.
*   **T9.3 (Fichier Manquant):** Retirer `Ex2.java` de la `filesMap`. Relancer `assessmentAnalyzer.analyze()`. Vérifier que `results.details[1].analysis` est `undefined` et `results.details[1].error` indique "File not found".
*   **T9.4 (Erreur Analyse Exercice):** Simuler une erreur dans `CodeAnalyzer.analyze` pour `ex2`. Relancer `assessmentAnalyzer.analyze()`. Vérifier que `results.details[1].analysis` est `undefined` et `results.details[1].error` indique "Failed to analyze".
*   **T9.5 (Config Évaluation Invalide):** Tenter d'analyser avec un `assessmentId` pour lequel `loadAssessmentConfig` échouerait. Vérifier que `assessmentAnalyzer.analyze()` rejette la promesse ou lève une exception.

---

## Itération 10 : Intégration, Gestion Fichiers et Export

**Objectif:** Connecter l'analyseur d'évaluation au reste de l'extension, implémenter la lecture des fichiers de soumission et l'export des résultats.

**Étapes d'implémentation :**

1.  **Gestion des Fichiers (`fileUtils.ts` ou similaire) :**
    *   Créer un module utilitaire (ex: `src/utils/fileUtils.ts`).
    *   Implémenter une fonction `async readStudentFiles(assessmentId: string, config: AssessmentConfig): Promise<Map<string, string>>`.
        *   Déterminer le chemin du dossier de soumission (ex: `path.join(workspaceRoot, 'submissions', assessmentId)`).
        *   Lire le contenu du dossier.
        *   Pour chaque fichier `.java` trouvé :
            *   Lire son contenu.
            *   Stocker `[nomFichier, contenu]` dans la Map.
            *   *Amélioration potentielle :* Utiliser `config.exercises` pour ne lire que les fichiers potentiellement pertinents si une convention de nommage stricte existe.
        *   Gérer les erreurs (dossier non trouvé, erreurs de lecture).
    *   Implémenter la fonction `exportFindingsToJson(findings: AssessmentAnalysisFindings): Promise<void>`.
        *   Déterminer le chemin de sortie (ex: `path.join(workspaceRoot, 'results', `${findings.assessmentId}_findings.json`)`).
        *   Créer le dossier `results` s'il n'existe pas.
        *   Convertir l'objet `findings` en JSON (`JSON.stringify(findings, null, 2)`).
        *   Écrire le JSON dans le fichier de sortie.
        *   Gérer les erreurs d'écriture.
2.  **Intégration dans l'Extension (`extension.ts`) :**
    *   Dans le fichier principal de l'extension :
    *   Enregistrer une nouvelle commande VS Code (ex: `teachassist.analyzeAssessment`).
    *   Le handler de cette commande doit :
        *   Recevoir l'`assessmentId` (depuis l'interface utilisateur ou un argument de commande).
        *   Afficher un message d'information ("Analyse de l'évaluation '{assessmentId}' en cours...").
        *   Appeler `loadAssessmentConfig(assessmentId)` (pour obtenir la config nécessaire à `readStudentFiles`).
        *   Appeler `readStudentFiles(assessmentId, assessmentConfig)` pour obtenir la Map des fichiers.
        *   Instancier `const assessmentAnalyzer = new AssessmentAnalyzer(assessmentId);`.
        *   Appeler `const analysisFindings = await assessmentAnalyzer.analyze(filesMap);`.
        *   Appeler `await exportFindingsToJson(analysisFindings);`.
        *   Afficher un message de succès ("Analyse terminée. Résultats exportés dans results/{assessmentId}_findings.json") ou d'erreur.
        *   Gérer les erreurs à chaque étape avec des `try...catch` et des messages d'erreur clairs pour l'utilisateur.
3.  **Interface Utilisateur (WebView - Si Applicable) :**
    *   Assurer que le sélecteur dans la WebView (défini dans `PLAN_CODE-ANALYSER.md`) envoie bien la commande `analyzeAssessment` avec l'`assessmentId` sélectionné.

**Tests (Itération 10) :**

*   **T10.1 (File Reading OK):** Créer une structure de dossiers `submissions/td1/` avec `Banques.java` et `Formules.java`. Créer une `AssessmentConfig` pour `td1` listant `banques` et `formules`. Appeler `readStudentFiles('td1', config)`. Vérifier que la Map retournée contient les clés `Banques.java` et `Formules.java` avec leur contenu.
*   **T10.2 (File Reading - Dossier Manquant):** Appeler `readStudentFiles` pour un `assessmentId` dont le dossier n'existe pas. Vérifier qu'une erreur est levée ou qu'une Map vide est retournée (selon l'implémentation choisie).
*   **T10.3 (Export OK):** Créer un objet `AssessmentAnalysisFindings` factice. Appeler `exportFindingsToJson`. Vérifier que le fichier `results/assessmentId_findings.json` est créé avec le contenu JSON correct.
*   **T10.4 (End-to-End):** Mettre en place une configuration complète (`configs/assessments/e2e.json`, `configs/exercises/exA.json`, `submissions/e2e/ExA.java`).
    *   Déclencher la commande `teachassist.analyzeAssessment` avec l'ID `e2e` (manuellement via la palette de commandes VS Code ou via la WebView si fonctionnelle).
    *   Vérifier les messages d'information/succès dans VS Code.
    *   Vérifier que le fichier `results/e2e_findings.json` est généré et contient les résultats d'analyse attendus pour `ExA.java` basés sur `exA.json`.
*   **T10.5 (End-to-End Erreur):** Supprimer `ExA.java`. Relancer la commande. Vérifier le message d'erreur dans VS Code et/ou le contenu du JSON exporté (qui devrait indiquer "File not found" pour l'exercice `exA`).

---

## Itération 11 : Raffinement, Robustesse et Tests Complets

**Objectif:** Consolider l'implémentation, améliorer la gestion des erreurs, ajouter du logging et mettre en place une suite de tests exhaustive.

**Étapes d'implémentation :**

1.  **Revue et Amélioration de la Gestion des Erreurs :**
    *   Passer en revue tous les points de défaillance potentiels (parsing, chargement de config, lecture/écriture de fichiers, logique d'analyse).
    *   S'assurer que les erreurs sont capturées de manière appropriée (`try...catch`).
    *   Utiliser des types d'erreurs personnalisés si nécessaire (ex: `ConfigurationError`, `AnalysisError`) pour une meilleure distinction.
    *   Fournir des messages d'erreur clairs et informatifs, à la fois pour le logging interne et pour l'utilisateur final via les messages VS Code.
2.  **Optimisation (Si Nécessaire) :**
    *   Si des problèmes de performance sont observés avec des fichiers volumineux ou des configurations complexes :
        *   Profiler le code pour identifier les goulots d'étranglement.
        *   Optimiser le parcours du CST (ex: utiliser des visiteurs ciblés plutôt que de parcourir l'arbre entier pour chaque règle).
        *   Optimiser les recherches par pattern (RegExp).
3.  **Logging :**
    *   Intégrer une bibliothèque de logging simple (ou utiliser `console.log`/`console.error` de manière structurée).
    *   Ajouter des logs aux points clés : chargement des configurations, début/fin de l'analyse d'un fichier, erreurs rencontrées, export des résultats.
    *   Utiliser différents niveaux de log (debug, info, warn, error) pour contrôler la verbosité.
4.  **Tests Unitaires Complets :**
    *   Écrire des tests unitaires (avec un framework comme Jest ou Mocha/Chai) pour :
        *   `exerciseConfigLoader` et `assessmentConfigLoader` (cas nominaux, erreurs).
        *   `CodeAnalyzer` : Tester *chaque type de règle* individuellement avec des snippets de code Java ciblés (corrects et incorrects par rapport à la règle). Simuler des erreurs de parsing.
        *   `AssessmentAnalyzer`: Tester la logique d'agrégation, la gestion des erreurs par exercice, la gestion des fichiers manquants. Utiliser des mocks pour `CodeAnalyzer` et les chargeurs de config.
        *   Utilitaires (`fileUtils`, helpers de parcours CST).
5.  **Tests d'Intégration :**
    *   Écrire des tests d'intégration qui simulent l'exécution de la commande `teachassist.analyzeAssessment`.
    *   Ces tests devraient utiliser de vrais fichiers de configuration et de soumission dans une structure de dossiers temporaire.
    *   Vérifier l'ensemble du flux : lecture des fichiers, analyse complète, et génération correcte du fichier JSON de résultats.
    *   Tester différents scénarios d'évaluation (un exercice, plusieurs exercices, erreurs dans certains, fichiers manquants).

**Tests (Itération 11) :**

*   **T11.1 (Error Handling):** Introduire délibérément des erreurs à différents niveaux (JSON invalide, fichier Java avec syntaxe très cassée, chemin de soumission incorrect) et vérifier que l'extension gère ces cas gracieusement avec des messages clairs.
*   **T11.2 (Unit Test Coverage):** Exécuter la suite de tests unitaires et viser une couverture de code raisonnable pour les modules critiques (`CodeAnalyzer`, `AssessmentAnalyzer`, loaders).
*   **T11.3 (Integration Tests):** Exécuter la suite de tests d'intégration couvrant divers scénarios d'évaluation. Vérifier la validité et le contenu des fichiers JSON de résultats générés.
*   **T11.4 (Logging):** Exécuter une analyse et vérifier que les logs pertinents sont générés (peut nécessiter une configuration spécifique pour capturer les logs pendant les tests).
*   **T11.5 (Edge Cases):** Tester avec des cas limites : fichiers Java vides, configurations d'exercices sans règles, évaluations sans exercices, noms de fichiers/dossiers avec caractères spéciaux (si supporté).

--- 