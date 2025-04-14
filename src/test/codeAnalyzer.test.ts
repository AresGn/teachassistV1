import * as fs from 'fs';
import * as path from 'path';
import { CodeAnalyzer } from '../analyzer/codeAnalyzer';
import { loadExerciseConfig } from '../analyzer/exerciseConfigLoader';

// Import explicite de Jest
import { expect, describe, it, beforeAll, afterAll } from '@jest/globals';

// Fonction utilitaire pour charger un fichier de test
function loadTestFile(filename: string): string {
    const fixturePath = path.join(__dirname, 'fixtures', filename);
    return fs.readFileSync(fixturePath, 'utf-8');
}

describe('CodeAnalyzer', () => {
    
    describe('Configuration Loading', () => {
        it('should load valid exercise config', async () => {
            try {
                const config = await loadExerciseConfig('test-basic');
                expect(config).toBeDefined();
                expect(config.id).toBe('test-basic');
                expect(config.name).toBe('Test de base');
                expect(config.rules).toBeDefined();
            } catch (error) {
                fail(`Should not have thrown an error: ${error}`);
            }
        });

        it('should handle missing config file', async () => {
            try {
                await loadExerciseConfig('non-existent');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeDefined();
                expect((error as Error).message).toContain('not found');
            }
        });
    });

    describe('Syntax Parsing', () => {
        it('should parse valid Java code without errors', async () => {
            const code = loadTestFile('HelloWorld.java');
            const analyzer = new CodeAnalyzer('test-basic');
            const result = await analyzer.analyze(code);
            
            expect(result.syntaxErrors).toHaveLength(0);
            expect(result.findings.some(f => f.ruleId === 'syntax.valid')).toBe(true);
        });

        it('should detect syntax errors', async () => {
            const code = loadTestFile('SyntaxError.java');
            const analyzer = new CodeAnalyzer('test-basic');
            const result = await analyzer.analyze(code);
            
            expect(result.syntaxErrors.length).toBeGreaterThan(0);
            expect(result.findings.every(f => f.ruleId !== 'syntax.valid')).toBe(true);
        });
    });
    
    // Note: D'autres tests spécifiques aux règles seront ajoutés dans les itérations suivantes
}); 