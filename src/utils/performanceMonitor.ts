export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'mb' | 'fps' | 'count' | '%';
  timestamp: number;
  category: 'load' | 'render' | 'memory' | 'network' | 'user';
}

export interface PerformanceReport {
  appLoadTime: number;
  screenTransitions: PerformanceMetric[];
  memoryUsage: PerformanceMetric[];
  networkRequests: PerformanceMetric[];
  userInteractions: PerformanceMetric[];
  overallScore: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private startTimes: Map<string, number> = new Map();

  startTimer(name: string): void {
    this.startTimes.set(name, Date.now());
  }

  endTimer(name: string, category: PerformanceMetric['category'] = 'load'): PerformanceMetric | null {
    const startTime = this.startTimes.get(name);
    if (!startTime) return null;

    const duration = Date.now() - startTime;
    const metric: PerformanceMetric = {
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      category
    };

    this.metrics.push(metric);
    this.startTimes.delete(name);
    return metric;
  }

  recordMetric(name: string, value: number, unit: PerformanceMetric['unit'], category: PerformanceMetric['category']): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      category
    };
    this.metrics.push(metric);
  }

  getMetrics(category?: PerformanceMetric['category']): PerformanceMetric[] {
    if (category) {
      return this.metrics.filter(m => m.category === category);
    }
    return [...this.metrics];
  }

  getAverageMetric(name: string): number {
    const matchingMetrics = this.metrics.filter(m => m.name === name);
    if (matchingMetrics.length === 0) return 0;
    
    const sum = matchingMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / matchingMetrics.length;
  }

  generateReport(): PerformanceReport {
    const loadMetrics = this.getMetrics('load');
    const renderMetrics = this.getMetrics('render');
    const memoryMetrics = this.getMetrics('memory');
    const networkMetrics = this.getMetrics('network');
    const userMetrics = this.getMetrics('user');

    const appLoadTime = this.getAverageMetric('app-load') || 0;
    
    // Calculate overall performance score (0-100)
    let score = 100;
    if (appLoadTime > 3000) score -= 20;
    if (appLoadTime > 5000) score -= 30;
    
    const avgMemory = this.getAverageMetric('memory-usage');
    if (avgMemory > 100) score -= 15;
    if (avgMemory > 200) score -= 25;

    const avgNetworkTime = this.getAverageMetric('network-request');
    if (avgNetworkTime > 1000) score -= 10;
    if (avgNetworkTime > 2000) score -= 20;

    return {
      appLoadTime,
      screenTransitions: renderMetrics,
      memoryUsage: memoryMetrics,
      networkRequests: networkMetrics,
      userInteractions: userMetrics,
      overallScore: Math.max(0, score)
    };
  }

  clearMetrics(): void {
    this.metrics = [];
    this.startTimes.clear();
  }

  // Mock performance data for BETA testing
  generateMockData(): void {
    // App load time
    this.recordMetric('app-load', 1200, 'ms', 'load');
    
    // Screen transitions
    this.recordMetric('home-to-recipes', 150, 'ms', 'render');
    this.recordMetric('recipe-detail-load', 200, 'ms', 'render');
    this.recordMetric('pricing-screen-load', 180, 'ms', 'render');
    
    // Memory usage
    this.recordMetric('memory-usage', 85, 'mb', 'memory');
    this.recordMetric('memory-peak', 120, 'mb', 'memory');
    
    // Network requests
    this.recordMetric('api-recipes-search', 450, 'ms', 'network');
    this.recordMetric('api-user-profile', 320, 'ms', 'network');
    this.recordMetric('api-payment-plans', 280, 'ms', 'network');
    
    // User interactions
    this.recordMetric('search-input-response', 50, 'ms', 'user');
    this.recordMetric('button-tap-response', 25, 'ms', 'user');
    this.recordMetric('scroll-performance', 60, 'fps', 'user');
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-start app load timer
performanceMonitor.startTimer('app-load');

// Performance optimization utilities
export const optimizeImage = (imageUrl: string, width: number, height: number): string => {
  // Mock image optimization
  return `${imageUrl}?w=${width}&h=${height}&q=80`;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay) as unknown as number;
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

export const measureRenderTime = (componentName: string) => {
  return {
    start: () => performanceMonitor.startTimer(`render-${componentName}`),
    end: () => performanceMonitor.endTimer(`render-${componentName}`, 'render')
  };
};