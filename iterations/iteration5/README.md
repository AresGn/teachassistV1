# Itération 5 : Règles Spécifiques et Patterns

## 🎯 Objectif Principal
Implémenter des vérifications plus fines basées sur des patterns pour des logiques métier spécifiques et des conditions de domaine, permettant une analyse contextuelle approfondie du code.

## 📋 Sous-objectifs
1. Implémenter le système de patterns personnalisés
2. Ajouter les vérifications de domaine
3. Analyser les fonctions mathématiques
4. Implémenter la validation contextuelle
5. Générer des rapports détaillés sur les patterns détectés

## 📝 Extensions des Interfaces

### ExerciseConfig étendu
```typescript
interface ExerciseConfig {
    // ... propriétés existantes ...
    rules: {
        // ... règles existantes ...
        customPatterns?: {
            id: string;
            pattern: string;
            description: string;
            required: boolean;
            errorMessage?: string;
            context?: {
                method?: string;
                class?: string;
                scope?: 'method' | 'class' | 'file';
            };
            severity: 'error' | 'warning' | 'info';
        }[];
        domainChecks?: {
            id: string;
            condition: string;
            target: string;
            message: string;
            location: 'before' | 'after' | 'around';
            scope?: string;
        }[];
        mathFunctions?: {
            name: string;
            domainCondition?: {
                pattern: string;
                message: string;
            };
            implementationPattern?: {
                pattern: string;
                message: string;
            };
            alternatives?: string[];
        }[];
    };
}
```

### PatternAnalysis
```typescript
interface PatternMatch {
    patternId: string;
    location: Location;
    context: {
        scope: string;
        surroundingCode: string;
    };
    matchedText: string;
}

interface DomainCheckResult {
    checkId: string;
    satisfied: boolean;
    target: {
        name: string;
        location: Location;
    };
    condition: {
        found: boolean;
        location?: Location;
    };
}

interface MathFunctionAnalysis {
    functionName: string;
    calls: {
        location: Location;
        domainCheckPresent: boolean;
        implementationValid: boolean;
        suggestedAlternative?: string;
    }[];
}
```

## 🔍 Tests Détaillés

### 1. Tests des Patterns Personnalisés (T5.1)

#### Configuration de Test
```json
{
    "rules": {
        "customPatterns": [
            {
                "id": "initialization",
                "pattern": "\\w+\\s*=\\s*0",
                "description": "Variable initialization to zero",
                "required": true,
                "context": {
                    "method": "calculate"
                }
            },
            {
                "id": "validation",
                "pattern": "if\\s*\\(\\s*\\w+\\s*[<>]\\s*0\\s*\\)",
                "description": "Value validation",
                "required": true,
                "severity": "error"
            }
        ]
    }
}
```

#### Tests
```typescript
test('should detect required patterns in context', async () => {
    const code = `
        public class Calculator {
            public double calculate(double x) {
                double result = 0;
                if (x < 0) {
                    throw new IllegalArgumentException();
                }
                return result;
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings.every(f => f.status === 'passed')).toBe(true);
});

test('should detect missing patterns', async () => {
    const code = `
        public class Calculator {
            public double calculate(double x) {
                double result = 1; // Wrong initialization
                return result;
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings.some(f => 
        f.ruleId === 'customPattern.initialization' && 
        f.status === 'failed'
    )).toBe(true);
});
```

### 2. Tests des Vérifications de Domaine (T5.2)

#### Configuration
```json
{
    "rules": {
        "domainChecks": [
            {
                "id": "positive-input",
                "condition": "x > 0",
                "target": "Math.log",
                "message": "Input must be positive for logarithm",
                "location": "before"
            },
            {
                "id": "non-zero-denominator",
                "condition": "denominator != 0",
                "target": "divide",
                "message": "Denominator must be non-zero",
                "location": "before"
            }
        ]
    }
}
```

#### Tests
```typescript
test('should verify domain conditions', async () => {
    const code = `
        public class MathOps {
            public double logOperation(double x) {
                if (x > 0) {
                    return Math.log(x);
                }
                throw new IllegalArgumentException();
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings.find(f => 
        f.ruleId === 'domainCheck.positive-input'
    ).status).toBe('passed');
});

test('should detect missing domain checks', async () => {
    const code = `
        public class MathOps {
            public double divide(double a, double denominator) {
                return a / denominator; // Missing zero check
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings.find(f => 
        f.ruleId === 'domainCheck.non-zero-denominator'
    ).status).toBe('failed');
});
```

### 3. Tests des Fonctions Mathématiques (T5.3)

#### Configuration
```json
{
    "rules": {
        "mathFunctions": [
            {
                "name": "Math.sqrt",
                "domainCondition": {
                    "pattern": "x >= 0",
                    "message": "Square root requires non-negative input"
                },
                "implementationPattern": {
                    "pattern": "Math\\.sqrt\\(\\s*([^;]+)\\s*\\)",
                    "message": "Use Math.sqrt for square root calculation"
                },
                "alternatives": ["Math.abs(Math.sqrt(x))"]
            }
        ]
    }
}
```

#### Tests
```typescript
test('should analyze math function usage', async () => {
    const code = `
        public class MathOps {
            public double squareRoot(double x) {
                if (x >= 0) {
                    return Math.sqrt(x);
                }
                return Double.NaN;
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const analysis = result.mathFunctionAnalysis.find(a => 
        a.functionName === 'Math.sqrt'
    );
    expect(analysis.calls[0].domainCheckPresent).toBe(true);
    expect(analysis.calls[0].implementationValid).toBe(true);
});

test('should suggest alternatives for invalid usage', async () => {
    const code = `
        public class MathOps {
            public double squareRoot(double x) {
                return Math.sqrt(x); // Missing domain check
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const finding = result.findings.find(f => 
        f.ruleId === 'mathFunction.sqrt.domain'
    );
    expect(finding.status).toBe('failed');
    expect(finding.message).toContain('Math.abs(Math.sqrt(x))');
});
```

### 4. Tests de Validation Contextuelle (T5.4)

```typescript
test('should validate pattern in specific context', async () => {
    const code = `
        public class DataProcessor {
            private void initialize() {
                int count = 0; // Initialization in wrong method
            }
            
            public void calculate() {
                // Missing required initialization
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings.find(f => 
        f.ruleId === 'customPattern.initialization'
    ).status).toBe('failed');
});

test('should handle multiple contexts', async () => {
    const code = `
        public class DataProcessor {
            public void calculate() {
                int sum = 0;
                process();
            }
            
            public void process() {
                int total = 0;
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const matches = result.patternMatches.filter(m => 
        m.patternId === 'initialization'
    );
    expect(matches).toHaveLength(2);
});
```

### 5. Tests de Cas Complexes (T5.5)

```typescript
test('should handle nested patterns', async () => {
    const code = `
        public class ComplexMath {
            public double complexOperation(double x, double y) {
                if (x > 0) {
                    if (y != 0) {
                        return Math.log(x) / y;
                    }
                }
                return 0;
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings).toContainEqual(expect.objectContaining({
        ruleId: 'domainCheck.positive-input',
        status: 'passed'
    }));
    expect(result.findings).toContainEqual(expect.objectContaining({
        ruleId: 'domainCheck.non-zero-denominator',
        status: 'passed'
    }));
});

test('should analyze pattern combinations', async () => {
    const code = `
        public class DataValidator {
            public boolean validate(int value, String type) {
                if (value < 0) return false;
                if (type == null) return false;
                
                switch (type) {
                    case "positive":
                        return value > 0;
                    case "non-zero":
                        return value != 0;
                    default:
                        return true;
                }
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const patterns = result.patternMatches;
    expect(patterns.filter(p => p.patternId === 'validation'))
        .toHaveLength(3);
});
```

## 📈 Critères de Succès
1. ✅ Détection précise des patterns personnalisés
2. ✅ Validation correcte des conditions de domaine
3. ✅ Analyse complète des fonctions mathématiques
4. ✅ Vérification contextuelle efficace
5. ✅ Gestion des cas complexes et imbriqués
6. ✅ Tests couvrant > 90% du code

## 🚀 Points d'Extension
1. Support des expressions régulières avancées
2. Analyse de flux de données
3. Détection de patterns de sécurité
4. Suggestions d'optimisation automatiques

## 📚 Documentation
- [Guide des Patterns](./docs/patterns.md)
- [Guide des Vérifications de Domaine](./docs/domain-checks.md)
- [Guide des Fonctions Mathématiques](./docs/math-functions.md)

## 🔄 Prochaines Étapes
1. Implémenter les règles OOP
2. Ajouter le support des exceptions
3. Améliorer la détection des patterns complexes 