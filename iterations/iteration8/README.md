# Itération 8 : Configuration et Chargement des Évaluations

## 🎯 Objectif Principal
Définir la structure de configuration pour les évaluations complètes et implémenter le système de chargement de ces configurations.

## 📋 Sous-objectifs
1. Définir les interfaces de configuration
2. Implémenter le chargeur de configuration
3. Gérer les erreurs de configuration
4. Créer des exemples de configuration
5. Implémenter la validation des configurations

## 📝 Extensions des Interfaces

### AssessmentExercise
```typescript
interface AssessmentExercise {
    exerciseId: string;           // Référence à un ExerciseConfig
    maxPoints?: number;          // Points maximum pour l'exercice
    weight?: number;            // Coefficient de pondération
    required?: boolean;        // Si l'exercice est obligatoire
    dependencies?: string[];  // IDs des exercices prérequis
    metadata?: {
        category?: string;
        difficulty?: 'easy' | 'medium' | 'hard';
        estimatedTime?: number;  // En minutes
    };
}
```

### AssessmentConfig
```typescript
interface AssessmentConfig {
    assessmentId: string;
    name: string;
    description?: string;
    version?: string;
    exercises: AssessmentExercise[];
    totalMaxPoints?: number;
    passingThreshold?: number;
    metadata?: {
        author?: string;
        createdAt?: string;
        updatedAt?: string;
        tags?: string[];
        category?: string;
        difficulty?: 'easy' | 'medium' | 'hard';
        estimatedDuration?: number;  // En minutes
    };
    requirements?: {
        minExercises?: number;
        mandatoryExercises?: string[];
        minTotalPoints?: number;
        maxAttempts?: number;
    };
}
```

### ConfigValidationResult
```typescript
interface ConfigValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning';
    suggestedFix?: string;
}

interface ConfigValidationResult {
    isValid: boolean;
    errors: ConfigValidationError[];
    warnings: ConfigValidationError[];
}
```

## 🔍 Tests Détaillés

### 1. Tests de Configuration Valide (T8.1)

#### Configuration de Test
```json
{
    "assessmentId": "java-basics-2024",
    "name": "Java Basics Assessment 2024",
    "description": "Évaluation des concepts de base en Java",
    "exercises": [
        {
            "exerciseId": "variables-operators",
            "maxPoints": 20,
            "weight": 1.0,
            "required": true
        },
        {
            "exerciseId": "control-structures",
            "maxPoints": 30,
            "weight": 1.5,
            "dependencies": ["variables-operators"]
        }
    ],
    "totalMaxPoints": 50,
    "passingThreshold": 25,
    "metadata": {
        "author": "Teaching Team",
        "difficulty": "medium",
        "estimatedDuration": 120
    }
}
```

#### Tests
```typescript
test('should load valid assessment config', async () => {
    const config = await loadAssessmentConfig('java-basics-2024');
    expect(config).toMatchObject({
        assessmentId: 'java-basics-2024',
        name: 'Java Basics Assessment 2024',
        exercises: expect.arrayContaining([
            expect.objectContaining({
                exerciseId: 'variables-operators'
            })
        ])
    });
    expect(config.exercises).toHaveLength(2);
});

test('should validate exercise references', async () => {
    const config = await loadAssessmentConfig('java-basics-2024');
    const validationResult = await validateExerciseReferences(config);
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);
});
```

### 2. Tests d'ID Inexistant (T8.2)

```typescript
test('should handle non-existent assessment ID', async () => {
    await expect(loadAssessmentConfig('non-existent'))
        .rejects.toThrow('Assessment configuration not found: non-existent');
});

test('should provide helpful error for similar IDs', async () => {
    // Assuming 'java-basic-2024' exists but user tried 'java-basics-2024'
    try {
        await loadAssessmentConfig('java-basics-2024');
    } catch (error) {
        expect(error.message).toContain('Did you mean: java-basic-2024');
    }
});
```

### 3. Tests de JSON Malformé (T8.3)

```typescript
test('should handle malformed JSON', async () => {
    // Setup: Create malformed JSON file
    const malformedContent = `{
        "assessmentId": "malformed",
        "name": "Test",
        "exercises": [
            { "missing-bracket"
        ]
    }`;
    
    await expect(loadAssessmentConfig('malformed'))
        .rejects.toThrow('Invalid JSON format in configuration file');
});

test('should provide detailed parsing error information', async () => {
    try {
        await loadAssessmentConfig('malformed');
    } catch (error) {
        expect(error.details).toBeDefined();
        expect(error.details).toContain('line');
        expect(error.details).toContain('position');
    }
});
```

### 4. Tests de Structure Incorrecte (T8.4)

```typescript
test('should validate required fields', async () => {
    const config = {
        // Missing required 'assessmentId'
        name: "Test Assessment",
        exercises: []
    };
    
    const validation = await validateAssessmentConfig(config);
    expect(validation.isValid).toBe(false);
    expect(validation.errors[0].field).toBe('assessmentId');
});

test('should validate exercise structure', async () => {
    const config = {
        assessmentId: "test",
        name: "Test",
        exercises: [
            {
                // Missing required 'exerciseId'
                maxPoints: 10
            }
        ]
    };
    
    const validation = await validateAssessmentConfig(config);
    expect(validation.errors).toContainEqual(
        expect.objectContaining({
            field: 'exercises[0].exerciseId'
        })
    );
});

test('should validate points consistency', async () => {
    const config = {
        assessmentId: "test",
        name: "Test",
        exercises: [
            {
                exerciseId: "ex1",
                maxPoints: 30
            },
            {
                exerciseId: "ex2",
                maxPoints: 30
            }
        ],
        totalMaxPoints: 50  // Inconsistent with sum of maxPoints
    };
    
    const validation = await validateAssessmentConfig(config);
    expect(validation.warnings).toContainEqual(
        expect.objectContaining({
            field: 'totalMaxPoints',
            severity: 'warning'
        })
    );
});
```

### 5. Tests de Validation Avancée (T8.5)

```typescript
test('should validate exercise dependencies', async () => {
    const config = {
        assessmentId: "test",
        name: "Test",
        exercises: [
            {
                exerciseId: "ex2",
                dependencies: ["ex1"]  // ex1 not in exercises array
            }
        ]
    };
    
    const validation = await validateAssessmentConfig(config);
    expect(validation.errors).toContainEqual(
        expect.objectContaining({
            field: 'exercises[0].dependencies',
            message: expect.stringContaining('ex1')
        })
    );
});

test('should detect circular dependencies', async () => {
    const config = {
        assessmentId: "test",
        name: "Test",
        exercises: [
            {
                exerciseId: "ex1",
                dependencies: ["ex2"]
            },
            {
                exerciseId: "ex2",
                dependencies: ["ex1"]
            }
        ]
    };
    
    const validation = await validateAssessmentConfig(config);
    expect(validation.errors).toContainEqual(
        expect.objectContaining({
            field: 'dependencies',
            message: expect.stringContaining('circular')
        })
    );
});

test('should validate metadata consistency', async () => {
    const config = {
        assessmentId: "test",
        name: "Test",
        exercises: [
            {
                exerciseId: "ex1",
                metadata: {
                    estimatedTime: 30
                }
            },
            {
                exerciseId: "ex2",
                metadata: {
                    estimatedTime: 45
                }
            }
        ],
        metadata: {
            estimatedDuration: 60  // Inconsistent with sum of exercise times
        }
    };
    
    const validation = await validateAssessmentConfig(config);
    expect(validation.warnings).toContainEqual(
        expect.objectContaining({
            field: 'metadata.estimatedDuration',
            severity: 'warning'
        })
    );
});
```

## 📈 Critères de Succès
1. ✅ Chargement correct des configurations valides
2. ✅ Gestion appropriée des erreurs de configuration
3. ✅ Validation complète de la structure des configurations
4. ✅ Détection des incohérences dans les configurations
5. ✅ Validation des dépendances entre exercices
6. ✅ Tests couvrant > 90% du code

## 🚀 Points d'Extension
1. Support de l'héritage de configuration
2. Validation des contraintes temporelles
3. Système de versionnage des configurations
4. Import/Export de configurations
5. Interface graphique de configuration

## 📚 Documentation
- [Guide de Configuration](./docs/configuration-guide.md)
- [Validation des Configurations](./docs/config-validation.md)
- [Exemples de Configuration](./docs/config-examples.md)

## 🔄 Prochaines Étapes
1. Implémenter l'analyseur d'évaluation
2. Ajouter le support des métriques d'évaluation
3. Améliorer la gestion des erreurs 