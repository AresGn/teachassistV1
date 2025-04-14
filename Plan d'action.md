# Plan d'action détaillé pour développer l'extension TeachAssist

Voici un plan de développement itératif pour créer votre extension VS Code de correction automatique. Chaque étape comprend des tests spécifiques à effectuer avant de passer à la suivante.

## Phase 1: Structure de base et détection des fichiers

### Étape 1.1: Mise en place de la structure du projet
- Créer les dossiers principaux: `src`, `media`, `resources`
- Configurer le fichier `package.json` avec les dépendances
- Créer le fichier d'activation principal `extension.ts`
- Définir les commandes principales de l'extension

**Tests:**
- Vérifier que l'extension s'active dans VS Code sans erreur
- Vérifier que les commandes apparaissent dans la palette de commandes

### Étape 1.2: Implémentation de la détection des ZIP
- Créer un module `zipDetector.ts` utilisant `fs` et `glob`
- Implémenter une fonction qui trouve tous les fichiers ZIP du dossier ouvert
- Extraire les identifiants des étudiants à partir des noms de fichiers
- Stocker les informations dans une structure de données

**Tests:**
- Créer quelques ZIP de test avec différents noms
- Vérifier que tous les ZIP sont détectés correctement
- Vérifier que les identifiants d'étudiants sont extraits correctement

## Phase 2: Extraction et organisation des fichiers

### Étape 2.1: Fonction d'extraction des ZIP
- Implémenter un module `zipExtractor.ts` utilisant `adm-zip`
- Créer une fonction pour extraire chaque ZIP dans un dossier dédié
- Gérer les erreurs d'extraction (ZIP corrompu, permissions, etc.)

**Tests:**
- Tester l'extraction avec des ZIP valides et invalides
- Vérifier que la structure des dossiers extraits est correcte
- S'assurer que les erreurs sont correctement gérées et signalées

### Étape 2.2: Recherche des fichiers Java
- Créer un module `fileLocator.ts`
- Implémenter une fonction qui recherche récursivement les fichiers `.java`
- Associer chaque fichier trouvé à l'étudiant correspondant

**Tests:**
- Tester avec des ZIP contenant le fichier dans différents sous-dossiers
- Vérifier que tous les fichiers `.java` sont trouvés
- Tester le comportement avec des ZIP ne contenant pas le fichier recherché

## Phase 3: Analyse statique du code Java

### Étape 3.1: Configuration et déclenchement de l'analyse
- Créer un module `codeAnalyzer.ts` utilisant `java-parser`
- Implémenter le chargement des fichiers de configuration JSON par exercice
- Déclencher automatiquement l'analyse une fois le code soumis
- Générer l'arbre syntaxique du code Java

**Tests:**
- Vérifier que les fichiers de configuration sont correctement chargés
- Tester que l'analyse se déclenche automatiquement après soumission
- S'assurer que l'arbre syntaxique est correctement créé

### Étape 3.2: Analyse et génération des constats
- Développer les règles d'analyse basées sur la configuration
- Implémenter la vérification des domaines de définition
- Évaluer la structure, le style et les conventions du code
- Générer des constats d'analyse structurés (JSON)

**Tests:**
- Tester avec différents fichiers Java corrects et incorrects
- Vérifier que les constats sont précis et détaillés
- S'assurer que les règles de la configuration sont correctement appliquées

### Étape 3.3: Stockage des constats d'analyse
- Implémenter un mécanisme de stockage temporaire des constats
- Permettre l'accès aux résultats pour les phases ultérieures
- Gérer différentes options de stockage (mémoire, fichier local)

**Tests:**
- Vérifier que les constats sont correctement enregistrés
- Tester l'accès aux constats depuis d'autres modules
- S'assurer que les données restent cohérentes entre les phases

## Phase 4: Tests d'exécution du code

### Étape 4.1: Configuration du pont d'exécution Java
- Créer un module `javaRunner.ts` utilisant `java-bridge`
- Implémenter l'exécution du code Java soumis
- Configurer les entrées/sorties pour les tests automatiques

**Tests:**
- Vérifier que le code Java s'exécute correctement depuis l'extension
- Tester que les entrées/sorties sont correctement gérées
- S'assurer que les erreurs d'exécution sont capturées

### Étape 4.2: Exécution et validation des tests
- Exécuter le code avec les entrées de test spécifiées
- Capturer les sorties pour chaque entrée de test
- Comparer les résultats avec les valeurs attendues
- Enregistrer les résultats des tests (réussite/échec)

**Tests:**
- Tester avec des implémentations produisant des résultats corrects
- Tester avec des implémentations comportant des erreurs
- Vérifier que la comparaison avec les valeurs attendues est précise

### Étape 4.3: Stockage des résultats de test
- Implémenter un mécanisme de stockage des résultats de test
- Structurer les résultats pour faciliter leur analyse
- Préparer les données pour la phase d'évaluation par IA

**Tests:**
- Vérifier que les résultats sont correctement stockés
- Tester l'intégrité des données entre les phases
- S'assurer que le format des résultats est adapté pour l'IA

## Phase 5: Intégration de l'IA pour l'évaluation

### Étape 5.1: Préparation des données pour l'IA
- Créer un module d'évaluation par IA
- Structurer les entrées pour l'IA (constats d'analyse, résultats des tests)
- Intégrer le contexte de l'exercice (barème, critères)

**Tests:**
- Vérifier que toutes les données nécessaires sont correctement préparées
- Tester la structure des entrées fournies à l'IA
- S'assurer que le contexte de l'exercice est bien intégré

### Étape 5.2: Traitement et évaluation par l'IA
- Implémenter l'analyse des données par l'IA
- Développer l'algorithme d'évaluation de la qualité du code
- Mettre en place le calcul de note selon les critères définis
- Générer un feedback personnalisé détaillé

**Tests:**
- Tester l'évaluation avec différents types de soumissions
- Vérifier que les notes générées sont cohérentes
- S'assurer que le feedback est pertinent et utile

### Étape 5.3: Présentation des résultats
- Implémenter l'affichage de la note et du feedback à l'étudiant
- Développer un système d'annotations dans l'éditeur
- Créer un panneau de résultats dédié dans VS Code

**Tests:**
- Vérifier que les résultats s'affichent correctement
- Tester l'ergonomie de l'interface de feedback
- S'assurer que les annotations dans l'éditeur sont claires

## Phase 6: Interface utilisateur de l'extension

### Étape 6.1: Création du tableau de bord principal
- Créer un module `webviewPanel.ts` pour l'interface utilisateur
- Développer le HTML/CSS/JS du tableau de bord
- Implémenter la communication entre le webview et l'extension

**Tests:**
- Vérifier que l'interface s'affiche correctement
- Tester que les événements utilisateur sont capturés
- S'assurer que la communication bidirectionnelle fonctionne

### Étape 6.2: Visualisation des résultats
- Implémenter l'affichage des résultats dans le tableau
- Créer la vue détaillée pour chaque soumission
- Ajouter des fonctionnalités de filtrage et tri

**Tests:**
- Tester avec différents nombres de soumissions
- Vérifier que toutes les données sont correctement affichées
- S'assurer que les fonctionnalités de filtrage et tri fonctionnent

## Phase 7: Gestion des notes et feedback

### Étape 7.1: Calcul des notes selon le barème
- Créer un module `scoreCalculator.ts`
- Implémenter l'algorithme de notation basé sur le barème défini
- Permettre l'ajustement manuel des points

**Tests:**
- Tester avec différents scénarios d'analyse
- Vérifier que les notes correspondent au barème
- S'assurer que les ajustements manuels sont correctement enregistrés

### Étape 7.2: Génération de feedback personnalisé
- Implémenter la génération de commentaires pour chaque étudiant
- Combiner les résultats automatiques et les entrées du professeur
- Structurer le feedback de manière claire et utile

**Tests:**
- Vérifier que les commentaires sont générés pour chaque soumission
- Tester la qualité et la pertinence des feedbacks automatiques
- S'assurer que les commentaires manuels sont correctement intégrés

## Phase 8: Export et finalisation

### Étape 8.1: Export des résultats
- Créer un module `exporter.ts` utilisant `csvtojson` (pour la conversion inverse)
- Implémenter l'export des notes en CSV
- Générer des rapports individuels en markdown avec `marked`

**Tests:**
- Vérifier que les fichiers CSV sont correctement générés
- Tester que les rapports markdown sont bien formatés
- S'assurer que tous les détails sont inclus dans les exports

### Étape 8.2: Finalisation et polissage
- Ajouter des icônes et ressources visuelles
- Optimiser les performances pour de grands nombres de soumissions
- Améliorer la gestion des erreurs et la robustesse

**Tests:**
- Réaliser des tests complets du workflow de bout en bout
- Tester avec un grand nombre de soumissions
- Vérifier la stabilité de l'extension dans différentes configurations

## Phase 9: Documentation et déploiement

### Étape 9.1: Documentation utilisateur
- Rédiger un guide d'utilisation complet
- Créer des exemples et captures d'écran
- Ajouter une section FAQ

**Tests:**
- Vérifier que la documentation couvre toutes les fonctionnalités
- Tester que les instructions sont claires et précises
- S'assurer que les exemples sont pertinents

### Étape 9.2: Packaging et déploiement
- Finaliser le `package.json` et le manifeste d'extension
- Configurer le bundling avec la méthode choisie (unbundled)
- Préparer pour la distribution (locale ou marketplace)

**Tests:**
- Vérifier que l'extension empaquetée fonctionne correctement
- Tester l'installation dans différentes versions de VS Code
- S'assurer que toutes les dépendances sont correctement incluses

## Conseils pour le développement

1. **Développez de manière modulaire**: Assurez-vous que chaque module a une responsabilité unique et bien définie
2. **Testez rigoureusement**: À chaque étape, testez en profondeur avant de passer à la suivante
3. **Gérez les erreurs**: Implémentez une gestion robuste des erreurs pour chaque fonctionnalité
4. **Utilisez TypeScript pleinement**: Profitez du typage pour éviter les bugs
5. **Documentation interne**: Documentez votre code au fur et à mesure
6. **Feedback utilisateur**: Ajoutez des retours visuels pour toutes les opérations longues

Ce plan vous permettra de développer méthodiquement votre extension en garantissant que chaque composant fonctionne correctement avant d'avancer. La structure modulaire facilitera aussi les tests et les modifications futures.