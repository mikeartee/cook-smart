import {API_BASE_URL} from '../config/api';
import {getAuthToken} from '../utils/auth';

export interface ShoppingListItem {
  id: string;
  userId: string;
  ingredient: string;
  quantity: string;
  unit: string;
  category: string;
  isCompleted: boolean;
  recipeId?: string;
  dateCreated: string;
  dateUpdated: string;
}

export interface AddShoppingListItemRequest {
  ingredient: string;
  quantity: string;
  unit: string;
  category?: string;
  recipeId?: string;
}

class ShoppingListService {
  // Get all shopping list items for the user
  async getShoppingList(): Promise<ShoppingListItem[]> {
    try {
      const token = await getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/shopping-list`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch shopping list');
      }

      return data.items || [];
    } catch (error) {
      console.error('Error fetching shopping list:', error);
      throw error;
    }
  }

  // Add a single item to shopping list
  async addItem(item: AddShoppingListItemRequest): Promise<ShoppingListItem> {
    try {
      const token = await getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/shopping-list`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item');
      }

      return data.item;
    } catch (error) {
      console.error('Error adding shopping list item:', error);
      throw error;
    }
  }

  // Add multiple items to shopping list
  async addItems(
    items: AddShoppingListItemRequest[],
  ): Promise<ShoppingListItem[]> {
    try {
      const token = await getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/api/v1/shopping-list/bulk`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({items}),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add items');
      }

      return data.items || [];
    } catch (error) {
      console.error('Error adding shopping list items:', error);
      throw error;
    }
  }

  // Update an item
  async updateItem(
    itemId: string,
    updates: Partial<AddShoppingListItemRequest>,
  ): Promise<ShoppingListItem> {
    try {
      const token = await getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/api/v1/shopping-list/${itemId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update item');
      }

      return data.item;
    } catch (error) {
      console.error('Error updating shopping list item:', error);
      throw error;
    }
  }

  // Toggle item completion status
  async toggleCompleted(itemId: string): Promise<ShoppingListItem> {
    try {
      if (!itemId) {
        throw new Error('Item ID is required');
      }

      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/shopping-list/${itemId}/toggle`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('Toggle failed:', response.status, data);
        throw new Error(data.error || 'Failed to toggle item');
      }

      if (!data.item) {
        console.error('No item in response:', data);
        throw new Error('Item not found in response');
      }

      return data.item;
    } catch (error) {
      console.error('Error toggling shopping list item:', error);
      throw error;
    }
  }

  // Delete an item
  async deleteItem(itemId: string): Promise<void> {
    try {
      const token = await getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/api/v1/shopping-list/${itemId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting shopping list item:', error);
      throw error;
    }
  }

  // Clear all completed items
  async clearCompleted(): Promise<void> {
    try {
      const token = await getAuthToken();
      const url = `${API_BASE_URL}/api/v1/shopping-list/clear-completed`;

      console.log('🗑️ Clearing completed items...');
      console.log('URL:', url);
      console.log('Token:', token ? 'Present' : 'Missing');

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error('Clear completed failed:', data);
        throw new Error(data.error || 'Failed to clear completed items');
      }

      const data = await response.json().catch(() => ({}));
      console.log('Clear completed success:', data);
    } catch (error) {
      console.error('Error clearing completed items:', error);
      throw error;
    }
  }

  // Delete all items
  async deleteAll(): Promise<void> {
    try {
      const token = await getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/api/v1/shopping-list/all/items`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete all items');
      }
    } catch (error) {
      console.error('Error deleting all items:', error);
      throw error;
    }
  }
}

export const shoppingListService = new ShoppingListService();
