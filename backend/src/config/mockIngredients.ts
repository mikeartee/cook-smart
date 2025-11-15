import * as fs from 'fs';
import * as path from 'path';

const DB_FILE = path.join(__dirname, '../../data/ingredients.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export interface MockIngredient {
  id: string;
  name: string;
  category: string;
  common_unit: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
}

// Initialize with sample ingredients if file doesn't exist
if (!fs.existsSync(DB_FILE)) {
  const sampleIngredients: MockIngredient[] = [
    { id: '1', name: 'Chicken Breast', category: 'Meat', common_unit: 'lb', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 },
    { id: '2', name: 'Rice', category: 'Grains', common_unit: 'cup', calories_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3 },
    { id: '3', name: 'Broccoli', category: 'Vegetables', common_unit: 'cup', calories_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4 },
    { id: '4', name: 'Eggs', category: 'Dairy', common_unit: 'piece', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
    { id: '5', name: 'Milk', category: 'Dairy', common_unit: 'cup', calories_per_100g: 42, protein_per_100g: 3.4, carbs_per_100g: 5, fat_per_100g: 1 },
    { id: '6', name: 'Tomatoes', category: 'Vegetables', common_unit: 'piece', calories_per_100g: 18, protein_per_100g: 0.9, carbs_per_100g: 3.9, fat_per_100g: 0.2 },
    { id: '7', name: 'Pasta', category: 'Grains', common_unit: 'oz', calories_per_100g: 131, protein_per_100g: 5, carbs_per_100g: 25, fat_per_100g: 1.1 },
    { id: '8', name: 'Olive Oil', category: 'Oils', common_unit: 'tbsp', calories_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100 },
    { id: '9', name: 'Onions', category: 'Vegetables', common_unit: 'piece', calories_per_100g: 40, protein_per_100g: 1.1, carbs_per_100g: 9, fat_per_100g: 0.1 },
    { id: '10', name: 'Garlic', category: 'Vegetables', common_unit: 'clove', calories_per_100g: 149, protein_per_100g: 6.4, carbs_per_100g: 33, fat_per_100g: 0.5 }
  ];
  
  fs.writeFileSync(DB_FILE, JSON.stringify({ ingredients: sampleIngredients }, null, 2));
}

class MockIngredientsDB {
  private readDB(): { ingredients: MockIngredient[] } {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  }

  private writeDB(data: { ingredients: MockIngredient[] }): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  }

  async getAll(category?: string): Promise<MockIngredient[]> {
    const db = this.readDB();
    if (category) {
      return db.ingredients.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }
    return db.ingredients;
  }

  async searchIngredients(search: string, limit: number = 20): Promise<MockIngredient[]> {
    const db = this.readDB();
    const searchLower = search.toLowerCase();
    return db.ingredients
      .filter(i => i.name.toLowerCase().includes(searchLower))
      .slice(0, limit);
  }

  async getCategories(): Promise<string[]> {
    const db = this.readDB();
    const categories = new Set(db.ingredients.map(i => i.category));
    return Array.from(categories).sort();
  }

  async getById(id: string): Promise<MockIngredient | null> {
    const db = this.readDB();
    return db.ingredients.find(i => i.id === id) || null;
  }

  async create(ingredient: Omit<MockIngredient, 'id'>): Promise<MockIngredient> {
    const db = this.readDB();
    const newIngredient: MockIngredient = {
      ...ingredient,
      id: `ing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    db.ingredients.push(newIngredient);
    this.writeDB(db);
    return newIngredient;
  }
}

export default new MockIngredientsDB();
