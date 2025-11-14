import axios from 'axios';

interface BarcodeResult {
  found: boolean;
  product?: {
    name: string;
    brand?: string;
    category: string;
    nutrition_per_100g?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    barcode: string;
    source: 'openfoodfacts' | 'nutritionix' | 'usda' | 'manual';
  };
  manualEntryRequired?: boolean;
}

class BarcodeService {
  private nutritionixUsageCount = 0;
  private readonly NUTRITIONIX_LIMIT = 1500; // 500 free + 1000 paid per month

  async lookupBarcode(barcode: string): Promise<BarcodeResult> {
    try {
      // Step 1: Try Open Food Facts (FREE, international coverage)
      const openFoodResult = await this.tryOpenFoodFacts(barcode);
      if (openFoodResult.found && this.isGoodQuality(openFoodResult)) {
        return openFoodResult;
      }

      // Step 2: Try Nutritionix (500 free/month, then $0.002/request)
      if (this.nutritionixUsageCount < this.NUTRITIONIX_LIMIT) {
        const nutritionixResult = await this.tryNutritionix(barcode);
        if (nutritionixResult.found) {
          this.nutritionixUsageCount++;
          return nutritionixResult;
        }
      }

      // Step 3: Enhance with USDA data if we have product name
      if (openFoodResult.product?.name) {
        const enhancedResult = await this.enhanceWithUSDA(openFoodResult);
        if (enhancedResult.found) {
          return enhancedResult;
        }
      }

      // Step 4: Manual entry required
      return { found: false, manualEntryRequired: true };

    } catch (error) {
      console.error('Barcode lookup error:', error);
      return { found: false, manualEntryRequired: true };
    }
  }

  private async tryOpenFoodFacts(barcode: string): Promise<BarcodeResult> {
    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        { timeout: 5000 }
      );

      if (response.data.status === 1 && response.data.product) {
        const product = response.data.product;
        
        return {
          found: true,
          product: {
            name: product.product_name || product.product_name_en || 'Unknown Product',
            brand: product.brands,
            category: this.mapToCategory(product.categories),
            nutrition_per_100g: this.extractNutrition(product.nutriments),
            barcode,
            source: 'openfoodfacts'
          }
        };
      }

      return { found: false };
    } catch (error) {
      console.error('Open Food Facts error:', error);
      return { found: false };
    }
  }

  private async tryNutritionix(barcode: string): Promise<BarcodeResult> {
    try {
      const response = await axios.get(
        `https://trackapi.nutritionix.com/v2/search/item`,
        {
          params: { upc: barcode },
          headers: {
            'x-app-id': process.env.NUTRITIONIX_APP_ID,
            'x-app-key': process.env.NUTRITIONIX_API_KEY,
          },
          timeout: 5000
        }
      );

      if (response.data.foods && response.data.foods.length > 0) {
        const food = response.data.foods[0];
        
        return {
          found: true,
          product: {
            name: food.food_name,
            brand: food.brand_name,
            category: this.mapToCategory(food.tags?.food_group),
            nutrition_per_100g: {
              calories: Math.round((food.nf_calories / food.serving_weight_grams) * 100),
              protein: Math.round((food.nf_protein / food.serving_weight_grams) * 100 * 10) / 10,
              carbs: Math.round((food.nf_total_carbohydrate / food.serving_weight_grams) * 100 * 10) / 10,
              fat: Math.round((food.nf_total_fat / food.serving_weight_grams) * 100 * 10) / 10,
            },
            barcode,
            source: 'nutritionix'
          }
        };
      }

      return { found: false };
    } catch (error) {
      console.error('Nutritionix error:', error);
      return { found: false };
    }
  }

  private async enhanceWithUSDA(openFoodResult: BarcodeResult): Promise<BarcodeResult> {
    try {
      if (!openFoodResult.product?.name) return openFoodResult;

      const response = await axios.get(
        'https://api.nal.usda.gov/fdc/v1/foods/search',
        {
          params: {
            query: openFoodResult.product.name,
            dataType: ['Branded', 'Survey (FNDDS)'],
            pageSize: 5,
            api_key: process.env.USDA_API_KEY || 'DEMO_KEY'
          },
          timeout: 5000
        }
      );

      if (response.data.foods && response.data.foods.length > 0) {
        const food = response.data.foods[0];
        const nutrients = food.foodNutrients || [];

        const nutrition = {
          calories: this.findNutrient(nutrients, 1008) || 0, // Energy
          protein: this.findNutrient(nutrients, 1003) || 0, // Protein
          carbs: this.findNutrient(nutrients, 1005) || 0, // Carbs
          fat: this.findNutrient(nutrients, 1004) || 0, // Fat
        };

        return {
          found: true,
          product: {
            ...openFoodResult.product,
            nutrition_per_100g: nutrition,
            source: 'usda'
          }
        };
      }

      return openFoodResult;
    } catch (error) {
      console.error('USDA enhancement error:', error);
      return openFoodResult;
    }
  }

  private isGoodQuality(result: BarcodeResult): boolean {
    if (!result.product) return false;
    
    const hasName = result.product.name && result.product.name !== 'Unknown Product';
    const hasNutrition = result.product.nutrition_per_100g?.calories && result.product.nutrition_per_100g.calories > 0;
    
    return Boolean(hasName && hasNutrition);
  }

  private extractNutrition(nutriments: any): any {
    if (!nutriments) return undefined;

    return {
      calories: nutriments['energy-kcal_100g'] || nutriments['energy_100g'] || 0,
      protein: nutriments['proteins_100g'] || 0,
      carbs: nutriments['carbohydrates_100g'] || 0,
      fat: nutriments['fat_100g'] || 0,
    };
  }

  private findNutrient(nutrients: any[], nutrientId: number): number {
    const nutrient = nutrients.find(n => n.nutrientId === nutrientId);
    return nutrient ? nutrient.value : 0;
  }

  private mapToCategory(categories: string): string {
    if (!categories) return 'condiments';
    
    const categoryStr = categories.toLowerCase();
    
    if (categoryStr.includes('meat') || categoryStr.includes('poultry') || categoryStr.includes('fish') || categoryStr.includes('seafood')) {
      return 'proteins';
    }
    if (categoryStr.includes('vegetable') || categoryStr.includes('produce')) {
      return 'vegetables';
    }
    if (categoryStr.includes('fruit')) {
      return 'fruits';
    }
    if (categoryStr.includes('dairy') || categoryStr.includes('milk') || categoryStr.includes('cheese') || categoryStr.includes('yogurt')) {
      return 'dairy';
    }
    if (categoryStr.includes('grain') || categoryStr.includes('bread') || categoryStr.includes('cereal') || categoryStr.includes('pasta')) {
      return 'grains';
    }
    if (categoryStr.includes('spice') || categoryStr.includes('herb') || categoryStr.includes('seasoning')) {
      return 'spices';
    }
    
    return 'condiments';
  }

  // Usage tracking methods
  getNutritionixUsage(): { used: number; limit: number; remaining: number } {
    return {
      used: this.nutritionixUsageCount,
      limit: this.NUTRITIONIX_LIMIT,
      remaining: this.NUTRITIONIX_LIMIT - this.nutritionixUsageCount
    };
  }

  resetMonthlyUsage(): void {
    this.nutritionixUsageCount = 0;
  }
}

export default new BarcodeService();