'use client';

import { useState } from 'react';
import { Calendar, Plus, ShoppingCart, ChefHat, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Recipe {
  id: string;
  name: string;
  cookingTime: number;
  servings: number;
  ingredients: string[];
}

interface MealPlan {
  [key: string]: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
  };
}

const SAMPLE_RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Avocado Toast',
    cookingTime: 10,
    servings: 2,
    ingredients: ['2 slices bread', '1 avocado', 'salt', 'pepper', 'lemon juice'],
  },
  {
    id: '2',
    name: 'Greek Salad',
    cookingTime: 15,
    servings: 4,
    ingredients: ['tomatoes', 'cucumber', 'feta cheese', 'olives', 'olive oil'],
  },
  {
    id: '3',
    name: 'Grilled Chicken',
    cookingTime: 30,
    servings: 4,
    ingredients: ['chicken breast', 'olive oil', 'garlic', 'herbs', 'lemon'],
  },
  {
    id: '4',
    name: 'Oatmeal Bowl',
    cookingTime: 10,
    servings: 2,
    ingredients: ['oats', 'milk', 'banana', 'honey', 'berries'],
  },
  {
    id: '5',
    name: 'Pasta Primavera',
    cookingTime: 25,
    servings: 4,
    ingredients: ['pasta', 'vegetables', 'olive oil', 'garlic', 'parmesan'],
  },
  {
    id: '6',
    name: 'Salmon Teriyaki',
    cookingTime: 20,
    servings: 2,
    ingredients: ['salmon', 'soy sauce', 'honey', 'ginger', 'rice'],
  },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

export default function MealPlannerDemo(): React.ReactElement {
  const [mealPlan, setMealPlan] = useState<MealPlan>({
    Monday: { breakfast: SAMPLE_RECIPES[0], lunch: SAMPLE_RECIPES[1], dinner: SAMPLE_RECIPES[2] },
    Tuesday: { breakfast: SAMPLE_RECIPES[3], lunch: SAMPLE_RECIPES[4], dinner: SAMPLE_RECIPES[5] },
    Wednesday: {},
    Thursday: {},
    Friday: {},
    Saturday: {},
    Sunday: {},
  });
  const [draggedRecipe, setDraggedRecipe] = useState<Recipe | null>(null);
  const [showGroceryList, setShowGroceryList] = useState(false);

  const handleDragStart = (recipe: Recipe): void => {
    setDraggedRecipe(recipe);
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
  };

  const handleDrop = (day: string, mealType: string): void => {
    if (draggedRecipe) {
      setMealPlan({
        ...mealPlan,
        [day]: {
          ...mealPlan[day],
          [mealType]: draggedRecipe,
        },
      });
      setDraggedRecipe(null);
    }
  };

  const removeMeal = (day: string, mealType: string): void => {
    const newDayPlan = { ...mealPlan[day] };
    delete newDayPlan[mealType as keyof typeof newDayPlan];
    setMealPlan({
      ...mealPlan,
      [day]: newDayPlan,
    });
  };

  const generateGroceryList = (): string[] => {
    const ingredients = new Set<string>();
    Object.values(mealPlan).forEach((day) => {
      Object.values(day).forEach((recipe) => {
        if (recipe) {
          recipe.ingredients.forEach((ing) => ingredients.add(ing));
        }
      });
    });
    return Array.from(ingredients).sort();
  };

  const groceryList = generateGroceryList();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <Badge className="mb-4">Interactive Demo</Badge>
          <h1 className="mb-4 text-4xl font-bold">Meal Planner Demo</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Try our smart meal planning feature! Drag and drop recipes to plan your week, then
            generate an automatic shopping list.
          </p>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-4">
          <Card className="p-6 lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Calendar className="h-6 w-6" />
                Weekly Meal Plan
              </h2>
              <Button onClick={() => setShowGroceryList(!showGroceryList)} variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4" />
                {showGroceryList ? 'Hide' : 'Show'} Grocery List
              </Button>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="mb-2 grid grid-cols-8 gap-2">
                  <div className="font-semibold"></div>
                  {DAYS.map((day) => (
                    <div key={day} className="text-center font-semibold">
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                {MEAL_TYPES.map((mealType) => (
                  <div key={mealType} className="mb-2 grid grid-cols-8 gap-2">
                    <div className="flex items-center font-medium capitalize">{mealType}</div>
                    {DAYS.map((day) => (
                      <div
                        key={`${day}-${mealType}`}
                        className="min-h-[100px] rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-2 transition-colors hover:border-primary/50"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(day, mealType)}
                      >
                        {mealPlan[day]?.[mealType] ? (
                          <div className="group relative rounded bg-background p-2 shadow-sm">
                            <button
                              onClick={() => removeMeal(day, mealType)}
                              className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground group-hover:flex"
                            >
                              ×
                            </button>
                            <p className="text-xs font-medium line-clamp-2">
                              {mealPlan[day][mealType]?.name}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {mealPlan[day][mealType]?.cookingTime}min
                            </p>
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            Drop here
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <ChefHat className="h-5 w-5" />
              Available Recipes
            </h3>
            <div className="space-y-2">
              {SAMPLE_RECIPES.map((recipe) => (
                <div
                  key={recipe.id}
                  draggable
                  onDragStart={() => handleDragStart(recipe)}
                  className="cursor-move rounded-lg border bg-background p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="font-medium">{recipe.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{recipe.cookingTime}min</span>
                    <span>•</span>
                    <span>{recipe.servings} servings</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {showGroceryList && (
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl font-bold">
                <ShoppingCart className="h-5 w-5" />
                Auto-Generated Grocery List
              </h3>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
            {groceryList.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {groceryList.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Add recipes to your meal plan to generate a grocery list
              </p>
            )}
          </Card>
        )}

        <div className="mt-8 text-center">
          <Card className="inline-block p-8">
            <h3 className="mb-2 text-xl font-bold">Love this feature?</h3>
            <p className="mb-4 text-muted-foreground">
              Download Cook Smart to unlock the full meal planning experience
            </p>
            <div className="flex gap-3 justify-center">
              <Button size="lg">
                <Download className="mr-2 h-5 w-5" />
                Download for Android
              </Button>
              <Button size="lg" variant="outline">
                <Download className="mr-2 h-5 w-5" />
                Download for iOS
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

