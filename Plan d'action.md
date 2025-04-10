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
- Implémenter une fonction qui recherche récursivement les fichiers `Formules.java`
- Associer chaque fichier trouvé à l'étudiant correspondant

**Tests:**
- Tester avec des ZIP contenant le fichier dans différents sous-dossiers
- Vérifier que tous les fichiers `Formules.java` sont trouvés
- Tester le comportement avec des ZIP ne contenant pas le fichier recherché

## Phase 3: Analyse statique du code Java

### Étape 3.1: Parsing et analyse du code
- Créer un module `codeAnalyzer.ts` utilisant `java-parser`
- Implémenter l'analyse de la structure du code Java
- Vérifier la présence des conditions de domaine de définition
- Détecter l'implémentation des expressions mathématiques

**Tests:**
- Tester avec différents fichiers `Formules.java` corrects et incorrects
- Vérifier que les domaines de définition sont correctement détectés
- S'assurer que l'analyse fonctionne même avec des variations de code

### Étape 3.2: Évaluation de la structure et du style
- Étendre `codeAnalyzer.ts` pour évaluer:
  - L'organisation du code
  - La lisibilité et les conventions
  - La présence de commentaires
  - La gestion des exceptions

**Tests:**
- Tester avec des codes de différentes qualités structurelles
- Vérifier que le système attribue des scores cohérents
- S'assurer que les différents aspects du code sont correctement évalués

## Phase 4: Tests d'exécution du code

### Étape 4.1: Configuration du pont Java
- Créer un module `javaRunner.ts` utilisant `java-bridge`
- Configurer l'exécution de code Java depuis l'extension
- Implémenter une fonction pour les entrées/sorties virtuelles

**Tests:**
- Vérifier que le code Java peut être exécuté depuis l'extension
- Tester que les entrées/sorties sont correctement gérées
- S'assurer que les erreurs d'exécution sont capturées

### Étape 4.2: Exécution des tests automatiques
- Étendre `javaRunner.ts` pour tester avec les valeurs demandées (-1, 0, 2, 3, 8)
- Capturer et analyser les sorties pour chaque valeur de test
- Comparer avec les résultats attendus

**Tests:**
- Tester avec des implémentations qui produisent des résultats corrects
- Tester avec des implémentations comportant des erreurs
- Vérifier que l'analyse des résultats est précise

## Phase 5: Intégration de l'IA pour l'évaluation

### Étape 5.1: Configuration de l'API IA
- Créer un module `aiEvaluator.ts` utilisant OpenAI
- Configurer l'authentification à l'API
- Structurer les requêtes pour l'analyse de code

**Tests:**
- Vérifier que l'API répond correctement
- Tester avec des exemples de code simples
- S'assurer que les délais de réponse sont acceptables

### Étape 5.2: Analyse qualitative par IA
- Implémenter l'évaluation de la structure et du style du code
- Générer des commentaires personnalisés sur la qualité du code
- Produire des suggestions d'amélioration

**Tests:**
- Tester avec différents styles de code Java
- Vérifier que les commentaires sont pertinents et utiles
- S'assurer que l'évaluation est cohérente entre différents codes

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