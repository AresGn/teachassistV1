# Itération 4 : Structures de Contrôle et Opérateurs

## 🎯 Objectif Principal
Implémenter l'analyse des structures de contrôle et des opérateurs pour vérifier leur utilisation correcte et conforme aux exigences de l'exercice.

## 📋 Sous-objectifs
1. Implémenter la détection des structures de contrôle requises
2. Vérifier l'utilisation correcte des opérateurs autorisés
3. Analyser la complexité des expressions
4. Vérifier les bonnes pratiques d'utilisation
5. Générer des rapports détaillés sur l'utilisation des structures de contrôle

## 📝 Extensions des Interfaces

### ExerciseConfig étendu
```typescript
interface ExerciseConfig {
    // ... propriétés existantes ...
    rules: {
        // ... règles existantes ...
        controlStructures?: {
            required?: {
                type: 'if' | 'else' | 'switch' | 'for' | 'while' | 'do-while' | 'try-catch';
                minOccurrences?: number;
                maxOccurrences?: number;
                context?: string;
            }[];
            forbidden?: {
                type: 'if' | 'else' | 'switch' | 'for' | 'while' | 'do-while' | 'try-catch';
                message?: string;
            }[];
            nesting?: {
                maxDepth: number;
                structures?: ('if' | 'for' | 'while')[];
            };
        };
        operators?: {
            allowed?: {
                arithmetic?: ('+' | '-' | '*' | '/' | '%')[];
                comparison?: ('==' | '!=' | '>' | '<' | '>=' | '<=')[];
                logical?: ('&&' | '||' | '!')[];
                bitwise?: ('&' | '|' | '^' | '~' | '<<' | '>>')[];
            };
            required?: {
                type: 'arithmetic' | 'comparison' | 'logical' | 'bitwise';
                operator: string;
                minOccurrences?: number;
                context?: string;
            }[];
        };
    };
}
```

### ControlStructureAnalysis
```typescript
interface ControlStructureAnalysis {
    type: string;
    occurrences: number;
    locations: Location[];
    nestingDepth: number;
    containedStructures?: {
        type: string;
        count: number;
    }[];
}

interface OperatorUsage {
    operator: string;
    type: 'arithmetic' | 'comparison' | 'logical' | 'bitwise';
    occurrences: number;
    locations: Location[];
    contexts: {
        structure: string;
        expression: string;
    }[];
}
```

## 🔍 Tests Détaillés

### 1. Tests des Structures de Contrôle Requises (T4.1)

#### Configuration de Test
```json
{
    "rules": {
        "controlStructures": {
            "required": [
                {
                    "type": "for",
                    "minOccurrences": 1,
                    "context": "calculateSum"
                },
                {
                    "type": "if",
                    "minOccurrences": 2
                }
            ],
            "nesting": {
                "maxDepth": 3,
                "structures": ["if", "for"]
            }
        }
    }
}
```

#### Tests
```typescript
test('should detect required control structures', async () => {
    const code = `
        public class Test {
            public int calculateSum(int[] numbers) {
                int sum = 0;
                for (int i = 0; i < numbers.length; i++) {
                    if (numbers[i] > 0) {
                        sum += numbers[i];
                    }
                    if (sum > 1000) {
                        break;
                    }
                }
                return sum;
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings.every(f => f.status === 'passed')).toBe(true);
});

test('should detect missing required structures', async () => {
    const code = `
        public class Test {
            public int calculateSum(int[] numbers) {
                int sum = 0;
                int i = 0;
                while (i < numbers.length) {
                    sum += numbers[i];
                    i++;
                }
                return sum;
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const forFinding = result.findings.find(f => 
        f.ruleId === 'requiredStructure.for'
    );
    expect(forFinding.status).toBe('failed');
});
```

### 2. Tests des Opérateurs (T4.2)

#### Configuration
```json
{
    "rules": {
        "operators": {
            "allowed": {
                "arithmetic": ["+", "-", "*"],
                "comparison": ["==", "<", ">"],
                "logical": ["&&", "||"]
            },
            "required": [
                {
                    "type": "arithmetic",
                    "operator": "*",
                    "minOccurrences": 1,
                    "context": "calculate"
                }
            ]
        }
    }
}
```

#### Tests
```typescript
test('should detect forbidden operators', async () => {
    const code = `
        public class Test {
            public double calculate(double x, double y) {
                return x / y; // Division not allowed
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings[0].status).toBe('failed');
    expect(result.findings[0].message).toContain('operator / is not allowed');
});

test('should verify required operator usage', async () => {
    const code = `
        public class Test {
            public double calculate(double x, double y) {
                return x + y; // Missing required multiplication
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const finding = result.findings.find(f => 
        f.ruleId === 'requiredOperator.arithmetic.*'
    );
    expect(finding.status).toBe('failed');
});
```

### 3. Tests de Nesting et Complexité (T4.3)

```typescript
test('should detect excessive nesting', async () => {
    const code = `
        public class Test {
            public void deeplyNested() {
                for (int i = 0; i < 10; i++) {
                    if (i > 5) {
                        for (int j = 0; j < 10; j++) {
                            if (j > 5) {
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
    expect(result.findings[0].message).toContain('nesting depth');
});

test('should analyze structure composition', async () => {
    const code = `
        public class Test {
            public void mixed() {
                for (int i = 0; i < 10; i++) {
                    while (condition()) {
                        if (test()) {
                            // Mixed structures
                        }
                    }
                }
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const analysis = result.controlStructureAnalysis;
    expect(analysis.find(a => a.type === 'for').containedStructures)
        .toContainEqual({ type: 'while', count: 1 });
});
```

### 4. Tests de Contexte et Usage (T4.4)

```typescript
test('should verify operator usage in context', async () => {
    const code = `
        public class Test {
            public boolean validate(int value) {
                return value > 0 && value < 100;
            }
            
            public int process(int value) {
                return value * 2; // Multiplication in wrong context
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const finding = result.findings.find(f => 
        f.ruleId === 'requiredOperator.context'
    );
    expect(finding.status).toBe('failed');
    expect(finding.message).toContain('required in calculate method');
});

test('should analyze operator combinations', async () => {
    const code = `
        public class Test {
            public boolean isValid(int x, int y) {
                return x > 0 && y > 0 || x * y > 100;
            }
        }
    `;
    const result = await analyzer.analyze(code);
    const operatorUsage = result.operatorAnalysis;
    expect(operatorUsage.find(u => u.operator === '&&').contexts)
        .toContainEqual(expect.objectContaining({
            structure: 'return',
            expression: expect.stringContaining('x > 0 && y > 0')
        }));
});
```

### 5. Tests de Cas Spéciaux (T4.5)

```typescript
test('should handle empty blocks correctly', async () => {
    const code = `
        public class Test {
            public void emptyBlocks() {
                if (condition()) {
                    // Empty
                } else {
                    // Empty
                }
                
                for (int i = 0; i < 10; i++) {
                    // Empty
                }
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings).toContainEqual(expect.objectContaining({
        ruleId: 'warning.emptyBlock',
        status: 'warning'
    }));
});

test('should detect redundant control structures', async () => {
    const code = `
        public class Test {
            public void redundant() {
                if (true) {
                    doSomething();
                }
                
                while (false) {
                    // Never executed
                }
            }
        }
    `;
    const result = await analyzer.analyze(code);
    expect(result.findings).toContainEqual(expect.objectContaining({
        ruleId: 'warning.redundantControl',
        status: 'warning'
    }));
});
```

## 📈 Critères de Succès
1. ✅ Détection précise des structures de contrôle requises
2. ✅ Validation correcte des opérateurs utilisés
3. ✅ Analyse exacte de la profondeur d'imbrication
4. ✅ Vérification contextuelle des opérateurs
5. ✅ Détection des cas particuliers et des mauvaises pratiques
6. ✅ Tests couvrant > 90% du code

## 🚀 Points d'Extension
1. Analyse de l'optimisation des structures de contrôle
2. Détection des patterns de conception
3. Suggestions d'amélioration automatiques
4. Support des expressions lambda et streams

## 📚 Documentation
- [Guide des Structures de Contrôle](./docs/control-structures.md)
- [Guide des Opérateurs](./docs/operators.md)
- [Bonnes Pratiques](./docs/best-practices.md)

## 🔄 Prochaines Étapes
1. Implémenter les règles de style et de formatage
2. Ajouter le support des expressions lambda
3. Améliorer la détection des patterns 