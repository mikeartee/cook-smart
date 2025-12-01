'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { recipesApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React from 'react';

interface RecipeEditPageProps {
  params: Promise<{ id: string }>;
}

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface RecipeFormData {
  title: string;
  description: string;
  cookingTime: number;
  servings: number;
  difficulty: string;
  ingredients: Ingredient[];
  instructions: string[];
  dietaryTags: string[];
  imageUrl: string;
  status: 'draft' | 'published';
  isFeatured: boolean;
}

export default function RecipeEditPage({ params }: RecipeEditPageProps): React.ReactElement {
  const { id } = React.use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    cookingTime: 30,
    servings: 4,
    difficulty: 'medium',
    ingredients: [{ name: '', amount: '', unit: '' }],
    instructions: [''],
    dietaryTags: [],
    imageUrl: '',
    status: 'draft',
    isFeatured: false,
  });

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const data: any = await recipesApi.getById(id);
      setFormData({
        title: data.title || '',
        description: data.description || '',
        cookingTime: data.cookingTime || 30,
        servings: data.servings || 4,
        difficulty: data.difficulty || 'medium',
        ingredients: data.ingredients || [{ name: '', amount: '', unit: '' }],
        instructions: data.instructions || [''],
        dietaryTags: data.dietaryTags || [],
        imageUrl: data.imageUrl || '',
        status: data.status || 'draft',
        isFeatured: data.isFeatured || false,
      });
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
      alert('Failed to load recipe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!formData.title.trim()) {
      alert('Please enter a recipe title');
      return;
    }

    if (formData.ingredients.some((ing) => !ing.name.trim())) {
      alert('Please fill in all ingredient names');
      return;
    }

    if (formData.instructions.some((inst) => !inst.trim())) {
      alert('Please fill in all instruction steps');
      return;
    }

    try {
      setIsSaving(true);
      await recipesApi.update(id, formData);
      alert('Recipe updated successfully!');
      router.push(`/admin/recipes/${id}`);
    } catch (error) {
      console.error('Failed to save recipe:', error);
      alert('Failed to save recipe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }

    try {
      await recipesApi.delete(id);
      alert('Recipe deleted successfully');
      router.push('/admin/recipes');
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      alert('Failed to delete recipe');
    }
  };

  const addIngredient = (): void => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', amount: '', unit: '' }],
    });
  };

  const removeIngredient = (index: number): void => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string): void => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const addInstruction = (): void => {
    setFormData({
      ...formData,
      instructions: [...formData.instructions, ''],
    });
  };

  const removeInstruction = (index: number): void => {
    setFormData({
      ...formData,
      instructions: formData.instructions.filter((_, i) => i !== index),
    });
  };

  const updateInstruction = (index: number, value: string): void => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData({ ...formData, instructions: newInstructions });
  };

  const toggleDietaryTag = (tag: string): void => {
    setFormData({
      ...formData,
      dietaryTags: formData.dietaryTags.includes(tag)
        ? formData.dietaryTags.filter((t) => t !== tag)
        : [...formData.dietaryTags, tag],
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/recipes/${id}`}
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipe
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Edit Recipe</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Recipe Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter recipe title"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the recipe"
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="cookingTime">Cooking Time (min)</Label>
                  <Input
                    id="cookingTime"
                    type="number"
                    value={formData.cookingTime}
                    onChange={(e) => setFormData({ ...formData, cookingTime: parseInt(e.target.value) || 0 })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 0 })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="mt-2"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ingredients</h2>
              <Button size="sm" onClick={addIngredient}>
                <Plus className="mr-2 h-4 w-4" />
                Add Ingredient
              </Button>
            </div>
            <div className="space-y-3">
              {formData.ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Amount"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                    className="w-24"
                  />
                  <Input
                    placeholder="Unit"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    className="w-24"
                  />
                  <Input
                    placeholder="Ingredient name"
                    value={ing.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  {formData.ingredients.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Instructions</h2>
              <Button size="sm" onClick={addInstruction}>
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
            </div>
            <div className="space-y-3">
              {formData.instructions.map((inst, index) => (
                <div key={index} className="flex gap-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <Textarea
                    placeholder={`Step ${index + 1}`}
                    value={inst}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  {formData.instructions.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeInstruction(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Status</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Publication Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Feature this recipe
                </Label>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Dietary Tags</h2>
            <div className="flex flex-wrap gap-2">
              {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'low-carb', 'high-protein'].map((tag) => (
                <Badge
                  key={tag}
                  variant={formData.dietaryTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleDietaryTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <h2 className="mb-2 text-lg font-semibold text-red-900 dark:text-red-100">Danger Zone</h2>
            <p className="mb-4 text-sm text-red-700 dark:text-red-300">
              Deleting this recipe is permanent and cannot be undone.
            </p>
            <Button variant="destructive" onClick={handleDelete} className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Recipe
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

