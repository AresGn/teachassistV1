# Itération 7 : Règles de Style et Métriques de Qualité

## 🎯 Objectif Principal
Implémenter un système complet d'analyse du style de code et des métriques de qualité pour assurer la conformité aux standards de codage et mesurer la qualité globale du code.

## 📋 Sous-objectifs
1. Implémenter les règles de style de code
2. Mettre en place les métriques de qualité
3. Créer un système de notation
4. Générer des rapports détaillés
5. Fournir des suggestions d'amélioration

## 📝 Extensions des Interfaces

### ExerciseConfig étendu
```typescript
interface ExerciseConfig {
    // ... propriétés existantes ...
    rules: {
        // ... règles existantes ...
        style?: {
            naming?: {
                classes?: {
                    pattern?: string;
                    prefix?: string[];
                    suffix?: string[];
                    forbidden?: string[];
                };
                methods?: {
                    pattern?: string;
                    prefix?: string[];
                    suffix?: string[];
                    forbidden?: string[];
                };
                variables?: {
                    pattern?: string;
                    prefix?: string[];
                    suffix?: string[];
                    forbidden?: string[];
                };
                constants?: {
                    pattern?: string;
                    required?: boolean;
                };
            };
            formatting?: {
                indentation?: {
                    style: 'space' | 'tab';
                    size?: number;
                };
                lineLength?: {
                    max: number;
                    ignoreComments?: boolean;
                    ignoreImports?: boolean;
                };
                spacing?: {
                    beforeCurlyBraces?: boolean;
                    afterComma?: boolean;
                    aroundOperators?: boolean;
                };
                blankLines?: {
                    beforeClass?: number;
                    beforeMethod?: number;
                    beforeControlStructure?: number;
                };
            };
            documentation?: {
                classes?: {
                    required?: boolean;
                    format?: string;
                };
                methods?: {
                    required?: boolean;
                    format?: string;
                    paramFormat?: string;
                };
                fields?: {
                    required?: boolean;
                    format?: string;
                };
            };
        };
        metrics?: {
            complexity?: {
                cyclomatic?: {
                    max: number;
                    warn?: number;
                };
                cognitive?: {
                    max: number;
                    warn?: number;
                };
                halstead?: boolean;
            };
            size?: {
                methods?: {
                    lines?: number;
                    parameters?: number;
                    returnStatements?: number;
                };
                classes?: {
                    methods?: number;
                    fields?: number;
                    lines?: number;
                };
                files?: {
                    classes?: number;
                    lines?: number;
                };
            };
            maintainability?: {
                index?: {
                    min: number;
                    warn?: number;
                };
                dependencies?: {
                    max: number;
                    warn?: number;
                };
            };
            coverage?: {
                statements?: number;
                branches?: number;
                functions?: number;
                lines?: number;
            };
        };
    };
}
```

### StyleAnalysis
```typescript
interface StyleViolation {
    rule: string;
    location: Location;
    message: string;
    severity: 'error' | 'warning' | 'info';
    suggestedFix?: string;
}

interface MetricsReport {
    complexity: {
        cyclomatic: number;
        cognitive: number;
        halstead?: {
            difficulty: number;
            effort: number;
            volume: number;
        };
    };
    size: {
        methods: {
            count: number;
            avgLines: number;
            maxLines: number;
            avgParameters: number;
            maxParameters: number;
        };
        classes: {
            count: number;
            avgMethods: number;
            maxMethods: number;
            avgFields: number;
            maxFields: number;
        };
        total: {
            lines: number;
            statements: number;
            comments: number;
        };
    };
    maintainability: {
        index: number;
        dependencies: number;
        abstractness: number;
        instability: number;
    };
    coverage?: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
    };
}
```

## 🔍 Tests Détaillés

### 1. Tests des Règles de Style (T7.1)

#### Configuration de Test
```json
{
    "rules": {
        "style": {
            "naming": {
                "classes": {
                    "pattern": "^[A-Z][a-zA-Z0-9]*$",
                    "forbidden": ["Base", "Abstract", "Impl"]
                },
                "methods": {
                    "pattern": "^[a-z][a-zA-Z0-9]*$",
                    "prefix": ["get", "set", "is", "has"]
                }
            },
            "formatting": {
                "indentation": {
                    "style": "space",
                    "size": 4
                },
                "lineLength": {
                    "max": 100,
                    "ignoreComments": true
                }
            }
        }
    }
}
```

#### Tests
```typescript
test('should validate naming conventions', async () => {
    const code = `
        public class GoodClassName {
            private String goodVariableName;
            
            public void goodMethodName() {
                // Implementation
            }
        }
        
        public class bad_class_name { // Should fail
            public void BadMethodName() { // Should fail
                // Implementation
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.styleViolations).toContainEqual(expect.objectContaining({
        rule: 'style.naming.class',
        severity: 'error'
    }));
    expect(result.styleViolations).toContainEqual(expect.objectContaining({
        rule: 'style.naming.method',
        severity: 'error'
    }));
});

test('should validate formatting rules', async () => {
    const code = `
        public class Test{  // Missing space before brace
        public void method(){
         // Wrong indentation
            if(condition){  // Missing spaces around parentheses
                // Very long line that exceeds the maximum line length limit of 100 characters and should trigger a violation
            }
        }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.styleViolations).toContainEqual(expect.objectContaining({
        rule: 'style.formatting.spacing',
        severity: 'warning'
    }));
    expect(result.styleViolations).toContainEqual(expect.objectContaining({
        rule: 'style.formatting.lineLength',
        severity: 'error'
    }));
});
```

### 2. Tests des Métriques de Complexité (T7.2)

#### Configuration
```json
{
    "rules": {
        "metrics": {
            "complexity": {
                "cyclomatic": {
                    "max": 10,
                    "warn": 7
                },
                "cognitive": {
                    "max": 15,
                    "warn": 10
                }
            }
        }
    }
}
```

#### Tests
```typescript
test('should measure cyclomatic complexity', async () => {
    const code = `
        public class ComplexClass {
            public int complexMethod(int a, int b) {
                int result = 0;
                if (a > 0) {
                    if (b > 0) {
                        result = 1;
                    } else if (b < 0) {
                        result = 2;
                    } else {
                        result = 3;
                    }
                } else if (a < 0) {
                    switch (b) {
                        case 1: result = 4; break;
                        case 2: result = 5; break;
                        default: result = 6;
                    }
                }
                return result;
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const metrics = result.metricsReport;
    expect(metrics.complexity.cyclomatic).toBeGreaterThan(7);
    expect(result.findings).toContainEqual(expect.objectContaining({
        ruleId: 'metrics.complexity.cyclomatic',
        severity: 'warning'
    }));
});

test('should measure cognitive complexity', async () => {
    const code = `
        public class ComplexLogic {
            public void processData(List<String> data) {
                for (String item : data) {
                    if (item != null) {
                        while (item.length() > 0) {
                            try {
                                if (item.startsWith("A")) {
                                    processA(item);
                                } else if (item.startsWith("B")) {
                                    processB(item);
                                } else {
                                    processOther(item);
                                }
                            } catch (Exception e) {
                                handleError(e);
                            }
                            item = item.substring(1);
                        }
                    }
                }
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const metrics = result.metricsReport;
    expect(metrics.complexity.cognitive).toBeGreaterThan(10);
    expect(result.findings).toContainEqual(expect.objectContaining({
        ruleId: 'metrics.complexity.cognitive',
        severity: 'warning'
    }));
});
```

### 3. Tests des Métriques de Taille (T7.3)

#### Configuration
```json
{
    "rules": {
        "metrics": {
            "size": {
                "methods": {
                    "lines": 30,
                    "parameters": 4
                },
                "classes": {
                    "methods": 20,
                    "lines": 200
                }
            }
        }
    }
}
```

#### Tests
```typescript
test('should analyze method size metrics', async () => {
    const code = `
        public class LargeClass {
            public void largeMethod(
                String param1,
                String param2,
                String param3,
                String param4,
                String param5  // Exceeds parameter limit
            ) {
                // ... 40 lines of code ...
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const metrics = result.metricsReport.size.methods;
    expect(metrics.maxParameters).toBeGreaterThan(4);
    expect(metrics.maxLines).toBeGreaterThan(30);
    expect(result.findings).toContainEqual(expect.objectContaining({
        ruleId: 'metrics.size.method.parameters',
        severity: 'error'
    }));
});

test('should analyze class size metrics', async () => {
    const code = `
        public class HugeClass {
            // ... 25 method declarations ...
            // ... 250 lines of code ...
        }
    `;
    const result = await analyzer.analyze(code);
    const metrics = result.metricsReport.size.classes;
    expect(metrics.maxMethods).toBeGreaterThan(20);
    expect(result.findings).toContainEqual(expect.objectContaining({
        ruleId: 'metrics.size.class.methods',
        severity: 'error'
    }));
});
```

### 4. Tests de Maintenabilité (T7.4)

#### Configuration
```json
{
    "rules": {
        "metrics": {
            "maintainability": {
                "index": {
                    "min": 65,
                    "warn": 75
                },
                "dependencies": {
                    "max": 10,
                    "warn": 7
                }
            }
        }
    }
}
```

#### Tests
```typescript
test('should calculate maintainability index', async () => {
    const code = `
        public class ComplexSystem {
            private Map<String, List<Consumer<Object>>> handlers;
            private static final Logger logger = LoggerFactory.getLogger(ComplexSystem.class);
            
            public void processEvent(String eventType, Object data) {
                try {
                    if (handlers.containsKey(eventType)) {
                        handlers.get(eventType).forEach(handler -> {
                            try {
                                handler.accept(data);
                            } catch (Exception e) {
                                logger.error("Error in handler", e);
                            }
                        });
                    } else {
                        logger.warn("No handlers for event type: " + eventType);
                    }
                } catch (Exception e) {
                    logger.error("Error processing event", e);
                    throw new RuntimeException("Event processing failed", e);
                }
            }
            
            // ... more complex methods ...
        }
    `;
    const result = await analyzer.analyze(code);
    const metrics = result.metricsReport.maintainability;
    expect(metrics.index).toBeLessThan(75);
    expect(result.findings).toContainEqual(expect.objectContaining({
        ruleId: 'metrics.maintainability.index',
        severity: 'warning'
    }));
});

test('should analyze dependencies', async () => {
    const code = `
        import org.springframework.web.*;
        import org.hibernate.*;
        import com.fasterxml.jackson.*;
        import org.apache.commons.*;
        import org.slf4j.*;
        import javax.validation.*;
        import java.util.*;
        import java.io.*;
        import java.net.*;
        import java.time.*;
        import java.sql.*;
        
        public class TooManyDependencies {
            // Implementation using many external dependencies
        }
    `;
    const result = await analyzer.analyze(code);
    const metrics = result.metricsReport.maintainability;
    expect(metrics.dependencies).toBeGreaterThan(10);
    expect(result.findings).toContainEqual(expect.objectContaining({
        ruleId: 'metrics.maintainability.dependencies',
        severity: 'error'
    }));
});
```

### 5. Tests de Couverture (T7.5)

#### Configuration
```json
{
    "rules": {
        "metrics": {
            "coverage": {
                "statements": 80,
                "branches": 70,
                "functions": 85,
                "lines": 80
            }
        }
    }
}
```

#### Tests
```typescript
test('should analyze code coverage', async () => {
    const code = `
        public class CoverageExample {
            public int calculate(int a, int b, boolean add) {
                if (add) {
                    return a + b;
                } else {
                    return a - b;
                }
            }
            
            public void untested() {
                // This method has no tests
            }
        }
    `;
    const testCode = `
        @Test
        public void testCalculateAdd() {
            CoverageExample example = new CoverageExample();
            assertEquals(5, example.calculate(2, 3, true));
        }
        // Missing test for subtract case
    `;
    const result = await analyzer.analyze(code, testCode);
    const coverage = result.metricsReport.coverage;
    expect(coverage.functions).toBeLessThan(85);
    expect(coverage.branches).toBeLessThan(70);
    expect(result.findings).toContainEqual(expect.objectContaining({
        ruleId: 'metrics.coverage.branches',
        severity: 'warning'
    }));
});
```

## 📈 Critères de Succès
1. ✅ Validation précise des règles de style
2. ✅ Mesure fiable des métriques de complexité
3. ✅ Analyse exacte des métriques de taille
4. ✅ Évaluation pertinente de la maintenabilité
5. ✅ Calcul correct de la couverture de code
6. ✅ Génération de rapports détaillés et utiles

## 🚀 Points d'Extension
1. Intégration avec des outils d'analyse statique
2. Support pour les frameworks populaires
3. Personnalisation avancée des règles
4. Visualisation des métriques
5. Suggestions de refactoring automatiques

## 📚 Documentation
- [Guide de Style](./docs/style-guide.md)
- [Guide des Métriques](./docs/metrics-guide.md)
- [Configuration des Règles](./docs/rules-config.md)

## 🔄 Prochaines Étapes
1. Implémenter l'analyse de sécurité
2. Ajouter le support pour les frameworks
3. Améliorer les suggestions de refactoring 