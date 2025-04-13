# Itération 3 : Règles Structurelles Additionnelles

## 🎯 Objectif Principal
Implémenter des règles structurelles avancées pour vérifier l'absence d'éléments interdits et introduire des métriques de base sur la structure du code.

## 📋 Sous-objectifs
1. Implémenter la détection d'éléments interdits
2. Ajouter l'analyse de la longueur des méthodes
3. Implémenter la vérification de la complexité cyclomatique
4. Ajouter des métriques sur la structure des classes
5. Générer des rapports détaillés sur les violations structurelles

## 📝 Extensions des Interfaces

### ExerciseConfig étendu
```typescript
interface ExerciseConfig {
    // ... propriétés existantes ...
    rules: {
        // ... règles existantes ...
        disallowedElements?: {
            type: 'method' | 'class' | 'package' | 'statement' | 'expression';
            pattern: string;
            message?: string;
            severity: 'error' | 'warning';
        }[];
        structuralRules?: {
            maxMethodLength?: number;
            maxClassLength?: number;
            maxParameters?: number;
            maxCyclomaticComplexity?: number;
            maxInheritanceDepth?: number;
            maxNestedBlocks?: number;
        };
        metrics?: {
            collectMethodMetrics?: boolean;
            collectClassMetrics?: boolean;
            collectComplexityMetrics?: boolean;
        };
    };
}
```

### StructuralMetrics
```typescript
interface StructuralMetrics {
    methodMetrics?: {
        name: string;
        length: number;
        parameters: number;
        cyclomaticComplexity: number;
        nestedDepth: number;
        location: Location;
    }[];
    classMetrics?: {
        name: string;
        methods: number;
        fields: number;
        innerClasses: number;
        inheritanceDepth: number;
        location: Location;
    }[];
}
```

## 🔍 Tests Détaillés

### 1. Tests des Éléments Interdits (T3.1)

#### Configuration de Test
```json
{
    "rules": {
        "disallowedElements": [
            {
                "type": "method",
                "pattern": "System\\.exit",
                "message": "System.exit() is not allowed",
                "severity": "error"
            },
            {
                "type": "statement",
                "pattern": "Thread\\.sleep",
                "message": "Thread.sleep() should be avoided",
                "severity": "warning"
            },
            {
                "type": "package",
                "pattern": "sun\\..*",
                "message": "Sun proprietary API usage is forbidden",
                "severity": "error"
            }
        ]
    }
}
```

#### Tests
```typescript
test('should detect forbidden method calls', async () => {
    const code = `
        public class Test {
            public void exit() {
                System.exit(0);
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const finding = result.findings.find(f => 
        f.ruleId === 'disallowedElement.method.SystemExit'
    );
    expect(finding.status).toBe('failed');
    expect(finding.severity).toBe('error');
});

test('should detect multiple disallowed elements', async () => {
    const code = `
        import sun.misc.Unsafe;
        
        public class Test {
            public void problematic() {
                System.exit(0);
                Thread.sleep(1000);
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings.filter(f => f.status === 'failed')).toHaveLength(3);
});
```

### 2. Tests de Longueur de Méthode (T3.2)

#### Configuration
```json
{
    "rules": {
        "structuralRules": {
            "maxMethodLength": 20,
            "maxParameters": 3
        }
    }
}
```

#### Tests
```typescript
test('should detect long methods', async () => {
    const code = `
        public class Test {
            public void longMethod() {
                // ... 25 lignes de code ...
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const finding = result.findings.find(f => 
        f.ruleId === 'structural.methodLength'
    );
    expect(finding.status).toBe('failed');
    expect(finding.message).toContain('exceeds maximum length of 20');
});

test('should detect methods with too many parameters', async () => {
    const code = `
        public class Test {
            public void manyParams(int a, int b, int c, int d) {
                // Implementation
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings[0].status).toBe('failed');
    expect(result.findings[0].message).toContain('too many parameters');
});
```

### 3. Tests de Complexité Cyclomatique (T3.3)

#### Configuration
```json
{
    "rules": {
        "structuralRules": {
            "maxCyclomaticComplexity": 10
        },
        "metrics": {
            "collectComplexityMetrics": true
        }
    }
}
```

#### Tests
```typescript
test('should calculate cyclomatic complexity correctly', async () => {
    const code = `
        public class Test {
            public int complexMethod(int x, int y) {
                int result = 0;
                if (x > 0) {
                    if (y > 0) {
                        result = 1;
                    } else {
                        result = 2;
                    }
                } else if (x < 0) {
                    switch (y) {
                        case 1: result = 3; break;
                        case 2: result = 4; break;
                        default: result = 5;
                    }
                }
                return result;
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const metrics = result.metrics.methodMetrics[0];
    expect(metrics.cyclomaticComplexity).toBe(7);
});

test('should detect methods exceeding complexity threshold', async () => {
    const code = `
        public class Test {
            public void veryComplex() {
                // ... code with complexity > 10 ...
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings[0].status).toBe('failed');
    expect(result.findings[0].message).toContain('cyclomatic complexity');
});
```

### 4. Tests de Structure de Classe (T3.4)

#### Configuration
```json
{
    "rules": {
        "structuralRules": {
            "maxInheritanceDepth": 3,
            "maxNestedBlocks": 3
        },
        "metrics": {
            "collectClassMetrics": true
        }
    }
}
```

#### Tests
```typescript
test('should detect deep inheritance', async () => {
    const code = `
        class A {}
        class B extends A {}
        class C extends B {}
        class D extends C {}
        class E extends D {}
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings[0].status).toBe('failed');
    expect(result.findings[0].message).toContain('inheritance depth');
});

test('should detect deeply nested blocks', async () => {
    const code = `
        public class Test {
            public void deeplyNested() {
                if (true) {
                    while (true) {
                        if (true) {
                            for (int i = 0; i < 10; i++) {
                                // Too deep
                            }
                        }
                    }
                }
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings[0].status).toBe('failed');
    expect(result.findings[0].message).toContain('nested blocks');
});
```

### 5. Tests de Métriques (T3.5)

```typescript
test('should collect comprehensive metrics', async () => {
    const code = `
        public class Test {
            private int field1;
            private String field2;
            
            public void method1() {}
            public void method2() {}
            
            class Inner {
                public void innerMethod() {}
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const metrics = result.metrics.classMetrics[0];
    expect(metrics).toMatchObject({
        fields: 2,
        methods: 2,
        innerClasses: 1
    });
});
```

## 📈 Critères de Succès
1. ✅ Détection précise des éléments interdits
2. ✅ Mesure correcte de la longueur des méthodes
3. ✅ Calcul exact de la complexité cyclomatique
4. ✅ Analyse complète de la structure des classes
5. ✅ Génération de métriques détaillées
6. ✅ Tests couvrant > 90% du code

## 🚀 Points d'Extension
1. Support des expressions régulières avancées pour les patterns
2. Métriques de cohésion et couplage
3. Analyse des dépendances cycliques
4. Détection des code smells

## 📚 Documentation
- [Guide des Règles Structurelles](./docs/structural-rules.md)
- [Guide des Métriques](./docs/metrics.md)
- [Bonnes Pratiques](./docs/best-practices.md)

## 🔄 Prochaines Étapes
1. Implémenter l'analyse des structures de contrôle
2. Ajouter le support des opérateurs
3. Améliorer la précision des métriques 