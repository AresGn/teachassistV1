# Itération 2 : Implémentation des Règles Simples

## 🎯 Objectif Principal
Implémenter la capacité de vérifier la présence d'éléments structurels de base (classes, méthodes) et leur conformité aux règles définies dans la configuration.

## 📋 Sous-objectifs
1. Étendre les interfaces de configuration
2. Implémenter l'analyse des classes requises
3. Implémenter l'analyse des méthodes requises
4. Ajouter la vérification des signatures de méthodes
5. Implémenter la génération de rapports détaillés

## 📝 Extensions des Interfaces

### ExerciseConfig étendu
```typescript
interface ExerciseConfig {
    // ... propriétés existantes ...
    rules: {
        requiredClasses?: {
            name: string;
            isAbstract?: boolean;
            visibility?: 'public' | 'protected' | 'private';
            extends?: string;
            implements?: string[];
        }[];
        requiredMethods?: {
            name: string;
            visibility?: 'public' | 'protected' | 'private';
            isStatic?: boolean;
            returnType: string;
            parameters?: {
                type: string;
                name?: string;
            }[];
            throwsExceptions?: string[];
        }[];
    };
}
```

### MethodAnalysisResult
```typescript
interface MethodAnalysisResult {
    name: string;
    found: boolean;
    signatureMatch: boolean;
    visibilityMatch: boolean;
    returnTypeMatch: boolean;
    parametersMatch: boolean;
    location?: {
        line: number;
        column: number;
    };
}
```

## 🔍 Tests Détaillés

### 1. Tests des Classes Requises (T2.1)

#### Configuration de Test
```json
{
    "id": "class-requirements",
    "name": "Test des Classes Requises",
    "rules": {
        "requiredClasses": [
            {
                "name": "Calculator",
                "visibility": "public"
            },
            {
                "name": "MathOperations",
                "isAbstract": true,
                "implements": ["Operation"]
            }
        ]
    }
}
```

#### Tests de Classes
```typescript
test('should detect all required classes', async () => {
    const code = `
        public interface Operation {}
        
        public class Calculator {
            // Implementation
        }
        
        public abstract class MathOperations implements Operation {
            // Implementation
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings.filter(f => f.status === 'passed')).toHaveLength(2);
});

test('should detect missing abstract modifier', async () => {
    const code = `
        public interface Operation {}
        
        public class Calculator {
            // Implementation
        }
        
        public class MathOperations implements Operation {
            // Implementation
        }
    `;
    const result = await analyzer.analyze(code);
    const mathOpsFinding = result.findings.find(f => 
        f.ruleId === 'requiredClass.MathOperations'
    );
    expect(mathOpsFinding.status).toBe('failed');
    expect(mathOpsFinding.message).toContain('should be abstract');
});
```

### 2. Tests des Méthodes Requises (T2.2)

#### Configuration de Test
```json
{
    "rules": {
        "requiredMethods": [
            {
                "name": "calculate",
                "visibility": "public",
                "returnType": "double",
                "parameters": [
                    { "type": "double", "name": "a" },
                    { "type": "double", "name": "b" }
                ]
            },
            {
                "name": "validateInput",
                "visibility": "protected",
                "returnType": "boolean",
                "parameters": [
                    { "type": "double" }
                ],
                "throwsExceptions": ["IllegalArgumentException"]
            }
        ]
    }
}
```

#### Tests de Méthodes
```typescript
test('should validate method signature completely', async () => {
    const code = `
        public class Calculator {
            public double calculate(double a, double b) {
                return a + b;
            }
            
            protected boolean validateInput(double value) throws IllegalArgumentException {
                if (value < 0) throw new IllegalArgumentException("Negative value");
                return true;
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings.every(f => f.status === 'passed')).toBe(true);
});

test('should detect incorrect parameter types', async () => {
    const code = `
        public class Calculator {
            public double calculate(int a, int b) {
                return a + b;
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const calculateFinding = result.findings.find(f => 
        f.ruleId === 'requiredMethod.calculate'
    );
    expect(calculateFinding.status).toBe('failed');
    expect(calculateFinding.message).toContain('parameter types do not match');
});
```

### 3. Tests de Visibilité et Modificateurs (T2.3)
```typescript
test('should detect incorrect method visibility', async () => {
    const code = `
        public class Calculator {
            private double calculate(double a, double b) {
                return a + b;
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings[0].status).toBe('failed');
    expect(result.findings[0].message).toContain('should be public');
});

test('should detect missing static modifier', async () => {
    const config = {
        rules: {
            requiredMethods: [{
                name: "getInstance",
                isStatic: true,
                returnType: "Calculator"
            }]
        }
    };
    const code = `
        public class Calculator {
            public Calculator getInstance() {
                return new Calculator();
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings[0].status).toBe('failed');
    expect(result.findings[0].message).toContain('should be static');
});
```

### 4. Tests d'Héritage et Interfaces (T2.4)
```typescript
test('should validate inheritance hierarchy', async () => {
    const config = {
        rules: {
            requiredClasses: [{
                name: "AdvancedCalculator",
                extends: "Calculator",
                implements: ["Scientific", "Programmable"]
            }]
        }
    };
    const code = `
        public interface Scientific {}
        public interface Programmable {}
        public class Calculator {}
        public class AdvancedCalculator extends Calculator 
            implements Scientific, Programmable {
            // Implementation
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings[0].status).toBe('passed');
});
```

### 5. Tests de Cas Limites (T2.5)
```typescript
test('should handle duplicate method declarations', async () => {
    const code = `
        public class Calculator {
            public double calculate(double a, double b) { return a + b; }
            public double calculate(double x, double y) { return x * y; }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings[0].status).toBe('warning');
    expect(result.findings[0].message).toContain('multiple declarations');
});

test('should handle method overloading correctly', async () => {
    const config = {
        rules: {
            requiredMethods: [
                {
                    name: "calculate",
                    parameters: [{ type: "double" }]
                },
                {
                    name: "calculate",
                    parameters: [{ type: "double" }, { type: "double" }]
                }
            ]
        }
    };
    const code = `
        public class Calculator {
            public double calculate(double a) { return a; }
            public double calculate(double a, double b) { return a + b; }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings.every(f => f.status === 'passed')).toBe(true);
});
```

## 📈 Critères de Succès
1. ✅ Détection correcte des classes requises avec leurs modificateurs
2. ✅ Validation complète des signatures de méthodes
3. ✅ Gestion correcte de l'héritage et des interfaces
4. ✅ Support des surcharges de méthodes
5. ✅ Rapports détaillés et précis des problèmes trouvés
6. ✅ Tests couvrant > 90% du code

## 🚀 Points d'Extension
1. Support des génériques dans les signatures
2. Analyse des annotations
3. Vérification des implémentations des méthodes d'interface
4. Support des méthodes par défaut des interfaces

## 📚 Documentation
- [Guide des Règles de Configuration](./docs/rules.md)
- [Guide de Validation des Signatures](./docs/signatures.md)
- [Exemples de Configuration](./docs/examples.md)

## 🔄 Prochaines Étapes
1. Implémenter les règles de style et de formatage
2. Ajouter le support des métriques de complexité
3. Améliorer la détection des problèmes de conception 