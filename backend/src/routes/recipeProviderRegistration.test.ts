/**
 * Source-content guards for the recipe-provider registration shape.
 *
 * Originally pinned issue #24 acceptance criterion 1 — that every
 * `new RecipeProviderService([...])` call passed both FatSecret and
 * TheMealDB providers.
 *
 * Updated for issue #45: there should now be exactly ONE construction
 * site (the shared `services/recipeProvider.ts` singleton). Both
 * route files MUST import the singleton rather than constructing their
 * own. See docs/codebase-assessment.md F-OA-7.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROUTES_DIR = path.join(__dirname);
const SERVICES_DIR = path.join(__dirname, '..', 'services');

const ROUTE_FILES = [
  path.join(ROUTES_DIR, 'recipes.ts'),
  path.join(ROUTES_DIR, 'trendingRecipes.ts'),
];

describe('RecipeProviderService registration shape', () => {
  describe('issue #45: single shared instance', () => {
    it('exports a default singleton from services/recipeProvider.ts', () => {
      const sharedPath = path.join(SERVICES_DIR, 'recipeProvider.ts');
      expect(fs.existsSync(sharedPath)).toBe(true);

      const source = fs.readFileSync(sharedPath, 'utf8');
      // Must construct the orchestrator with both providers.
      expect(source).toMatch(/new\s+RecipeProviderService\s*\(/);
      expect(source).toMatch(/FatSecretAdapter\b/);
      expect(source).toMatch(/TheMealDB(Service|Adapter)?\b/);
      expect(source).toMatch(/export\s+default\s+recipeProviderService/);
    });

    it.each(ROUTE_FILES)(
      '%s does not construct its own RecipeProviderService instance',
      filePath => {
        const source = fs.readFileSync(filePath, 'utf8');
        const matches = source.match(/new\s+RecipeProviderService\s*\(/g);
        expect(matches).toBeNull();
      },
    );

    it.each(ROUTE_FILES)(
      '%s imports the shared recipeProvider singleton',
      filePath => {
        const source = fs.readFileSync(filePath, 'utf8');
        // Either named or default import from ../services/recipeProvider.
        expect(source).toMatch(/from\s+['"]\.\.\/services\/recipeProvider['"]/);
      },
    );
  });

  describe('issue #24: provider chain still passes both adapters', () => {
    it('the shared singleton registers both FatSecret and TheMealDB', () => {
      const sharedPath = path.join(SERVICES_DIR, 'recipeProvider.ts');
      const source = fs.readFileSync(sharedPath, 'utf8');

      // Strip comments so we don't false-match a commented-out provider.
      const codeOnly = source
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');

      expect(codeOnly).toMatch(/FatSecretAdapter\b/);
      expect(codeOnly).toMatch(/TheMealDB(Service|Adapter)?\b/);
    });
  });
});
