import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export interface ScannedProduct {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  cachedAt?: number;
  lastAccessedAt?: number;
  accessCount?: number;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    categories?: string;
    image_url?: string;
  };
}

export interface ProductLookupService {
  lookupByBarcode(barcode: string): Promise<ScannedProduct | null>;
  getCachedProduct(barcode: string): Promise<ScannedProduct | null>;
  cacheProduct(barcode: string, product: ScannedProduct): Promise<void>;
  updateCacheAccess(barcode: string): Promise<void>;
  clearExpiredCache(): Promise<void>;
}

class ProductLookupServiceImpl implements ProductLookupService {
  private readonly API_BASE_URL = 'https://world.openfoodfacts.org/api/v0/product';
  private readonly CACHE_PREFIX = 'barcode_cache_';
  private readonly API_TIMEOUT = 10000; // 10 seconds
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second rate limit

  /**
   * Lookup product by barcode (cache-first strategy)
   * @param barcode - The barcode to lookup
   * @returns Promise<ScannedProduct | null>
   */
  async lookupByBarcode(barcode: string): Promise<ScannedProduct | null> {
    try {
      // Check cache first
      const cachedProduct = await this.getCachedProduct(barcode);
      if (cachedProduct) {
        // Update access tracking
        await this.updateCacheAccess(barcode);
        return cachedProduct;
      }

      // Rate limiting
      await this.enforceRateLimit();

      // Call API
      const product = await this.fetchFromAPI(barcode);
      
      if (product) {
        // Cache the result
        await this.cacheProduct(barcode, product);
      }

      return product;
    } catch (error) {
      console.error('Error looking up product:', error);
      throw error;
    }
  }

  /**
   * Get cached product from AsyncStorage
   * @param barcode - The barcode to lookup
   * @returns Promise<ScannedProduct | null>
   */
  async getCachedProduct(barcode: string): Promise<ScannedProduct | null> {
    try {
      const key = `${this.CACHE_PREFIX}${barcode}`;
      const cached = await AsyncStorage.getItem(key);
      
      if (!cached) {
        return null;
      }

      const product: ScannedProduct = JSON.parse(cached);
      
      // Check if expired based on access count
      if (this.isExpired(product)) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return product;
    } catch (error) {
      console.error('Error getting cached product:', error);
      return null;
    }
  }

  /**
   * Cache product data with access tracking
   * @param barcode - The barcode
   * @param product - The product data to cache
   */
  async cacheProduct(barcode: string, product: ScannedProduct): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}${barcode}`;
      const now = Date.now();
      
      const cachedProduct: ScannedProduct = {
        ...product,
        cachedAt: now,
        lastAccessedAt: now,
        accessCount: 1,
      };

      await AsyncStorage.setItem(key, JSON.stringify(cachedProduct));
    } catch (error) {
      console.error('Error caching product:', error);
    }
  }

  /**
   * Update cache access tracking (increment count and timestamp)
   * @param barcode - The barcode
   */
  async updateCacheAccess(barcode: string): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}${barcode}`;
      const cached = await AsyncStorage.getItem(key);
      
      if (!cached) {
        return;
      }

      const product: ScannedProduct = JSON.parse(cached);
      product.lastAccessedAt = Date.now();
      product.accessCount = (product.accessCount || 0) + 1;

      await AsyncStorage.setItem(key, JSON.stringify(product));
    } catch (error) {
      console.error('Error updating cache access:', error);
    }
  }

  /**
   * Clear expired cache entries based on smart expiration rules
   */
  async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const product: ScannedProduct = JSON.parse(cached);
          if (this.isExpired(product)) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  /**
   * Fetch product data from Open Food Facts API
   * @param barcode - The barcode to lookup
   * @returns Promise<ScannedProduct | null>
   */
  private async fetchFromAPI(barcode: string): Promise<ScannedProduct | null> {
    try {
      const url = `${this.API_BASE_URL}/${barcode}.json`;
      const response = await axios.get<OpenFoodFactsResponse>(url, {
        timeout: this.API_TIMEOUT,
      });

      if (response.data.status === 1 && response.data.product) {
        return this.parseProductData(barcode, response.data);
      }

      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - please try again');
        }
        if (!error.response) {
          throw new Error('Network error - check your connection');
        }
      }
      throw error;
    }
  }

  /**
   * Parse Open Food Facts API response
   * @param barcode - The barcode
   * @param response - The API response
   * @returns ScannedProduct
   */
  private parseProductData(
    barcode: string,
    response: OpenFoodFactsResponse
  ): ScannedProduct {
    const product = response.product!;
    
    // Extract product name (required)
    let name = product.product_name?.trim() || 'Unknown Product';
    
    // Extract brand (optional)
    const brand = product.brands?.split(',')[0]?.trim();
    
    // If we have a brand, append it to the name
    if (brand) {
      name = `${name} (${brand})`;
    }
    
    // Extract category (optional)
    const category = product.categories?.split(',')[0]?.trim();
    
    // Extract image URL (optional)
    const imageUrl = product.image_url;

    return {
      barcode,
      name,
      brand,
      category,
      imageUrl,
    };
  }

  /**
   * Check if cached product is expired based on access count
   * Smart expiration rules:
   * - 5+ scans: Never expires
   * - 3-4 scans: Expires after 90 days of no access
   * - 1-2 scans: Expires after 30 days of no access
   * @param product - The cached product
   * @returns boolean
   */
  private isExpired(product: ScannedProduct): boolean {
    const accessCount = product.accessCount || 0;
    const lastAccessed = product.lastAccessedAt || product.cachedAt || 0;
    const now = Date.now();
    const daysSinceAccess = (now - lastAccessed) / (1000 * 60 * 60 * 24);

    // Frequently scanned items never expire
    if (accessCount >= 5) {
      return false;
    }

    // Medium usage: 90 days
    if (accessCount >= 3) {
      return daysSinceAccess > 90;
    }

    // Rarely scanned: 30 days
    return daysSinceAccess > 30;
  }

  /**
   * Enforce rate limiting (1 request per second)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise<void>(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
}

// Export singleton instance
export const productLookupService = new ProductLookupServiceImpl();
