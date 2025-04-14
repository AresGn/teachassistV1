# Itération 1 : Setup de Base et Parsing Initial

## 🎯 Objectif Principal
Mettre en place la structure de base du projet, intégrer le parser Java et implémenter la gestion des erreurs de syntaxe fondamentales.

## 📋 Sous-objectifs
1. Établir la structure du projet
2. Définir les interfaces de base
3. Implémenter le chargeur de configuration simple
4. Créer le squelette de l'analyseur de code
5. Intégrer le parser Java avec gestion des erreurs

## 🏗️ Structure du Projet

```
src/
  ├── analyzer/
  │   ├── types.ts              # Interfaces et types de base
  │   ├── exerciseConfigLoader.ts # Chargeur de configuration
  │   └── codeAnalyzer.ts       # Analyseur de code principal
  ├── configs/
  │   └── exercises/            # Configurations des exercices
  └── test/
      └── fixtures/             # Fichiers de test
```

## 📝 Interfaces Clés

### FindingDetail
```typescript
interface FindingDetail {
    ruleId: string;           // Identifiant unique de la règle
    description: string;      // Description du constat
    status: 'passed' | 'failed' | 'warning' | 'info';
    message?: string;        // Message détaillé optionnel
    location?: {            // Information de localisation
        line: number;
        column: number;
    };
}
```

### SyntaxErrorDetail
```typescript
interface SyntaxErrorDetail {
    line: number;
    column: number;
    message: string;
    code?: string;         // Extrait du code problématique
}
```

### ExerciseAnalysisFindings
```typescript
interface ExerciseAnalysisFindings {
    exerciseId: string;
    findings: FindingDetail[];
    syntaxErrors: SyntaxErrorDetail[];
    metadata?: {
        analysisDate: string;
        parserVersion: string;
    };
}
```

### ExerciseConfig
```typescript
interface ExerciseConfig {
    id: string;
    name: string;
    description: string;
    rules: {
        // Configuration initiale minimale
    };
}
```

## 🔍 Tests Détaillés

### 1. Tests de Configuration (T1.1)
#### Test de Chargement Valide
```typescript
test('should load valid exercise config', async () => {
    const config = await loadExerciseConfig('test-basic');
    expect(config).toHaveProperty('id', 'test-basic');
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('rules');
});
```

#### Test de Configuration Invalide
```typescript
test('should handle missing config file', async () => {
    await expect(loadExerciseConfig('non-existent'))
        .rejects.toThrow('Configuration file not found');
});

test('should handle malformed JSON', async () => {
    // Setup malformed JSON file
    await expect(loadExerciseConfig('malformed'))
        .rejects.toThrow('Invalid JSON format');
});
```

### 2. Tests de Parsing (T1.2)
#### Test de Code Valide
```typescript
test('should parse valid Java code', async () => {
    const code = `
        public class HelloWorld {
            public static void main(String[] args) {
                System.out.println("Hello, World!");
            }
        }
    `;
    const analyzer = new CodeAnalyzer('test-basic');
    const result = await analyzer.analyze(code);
    expect(result.syntaxErrors).toHaveLength(0);
});
```

### 3. Tests d'Erreurs de Syntaxe (T1.3)
#### Test de Différents Types d'Erreurs
```typescript
test('should detect missing semicolon', async () => {
    const code = `
        public class Test {
            void method() {
                int x = 5    // Missing semicolon
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.syntaxErrors).toHaveLength(1);
    expect(result.syntaxErrors[0]).toMatchObject({
        line: 4,
        message: expect.stringContaining('semicolon')
    });
});

test('should detect unmatched braces', async () => {
    const code = `
        public class Test {
            void method() {
                if (true) {
                    // Missing closing brace
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.syntaxErrors).toHaveLength(1);
});
```

## 📈 Critères de Succès
1. ✅ Structure du projet en place et fonctionnelle
2. ✅ Interfaces de base définies et documentées
3. ✅ Chargeur de configuration fonctionnel avec gestion d'erreurs
4. ✅ Parser Java intégré et capable de détecter les erreurs de syntaxe basiques
5. ✅ Tests unitaires passant avec une couverture > 80%

## 🚀 Points d'Extension
1. Support de la localisation des messages d'erreur
2. Amélioration du reporting des erreurs de syntaxe avec suggestions
3. Support de configurations par défaut/héritage
4. Métriques de performance du parsing

## 📚 Documentation
- [Guide d'Installation](./docs/setup.md)
- [Guide de Configuration](./docs/configuration.md)
- [Guide des Tests](./docs/testing.md)

## 🔄 Prochaines Étapes
1. Implémenter les règles de validation simples
2. Ajouter le support des métriques de code
3. Améliorer la gestion des erreurs 