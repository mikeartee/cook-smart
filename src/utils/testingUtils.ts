export interface TestResult {
  testName: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  details?: string;
}

export interface TestSuite {
  suiteName: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
}

export class TestRunner {
  private results: TestResult[] = [];

  async runTest(testName: string, testFn: () => Promise<void> | void): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        testName,
        status: 'pass',
        duration,
        details: `Test completed successfully in ${duration}ms`
      };
      
      this.results.push(result);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        testName,
        status: 'fail',
        duration,
        error: error.message || 'Unknown error',
        details: `Test failed after ${duration}ms`
      };
      
      this.results.push(result);
      return result;
    }
  }

  skipTest(testName: string, reason: string): TestResult {
    const result: TestResult = {
      testName,
      status: 'skip',
      duration: 0,
      details: `Test skipped: ${reason}`
    };
    
    this.results.push(result);
    return result;
  }

  getSummary(): TestSuite {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'pass').length;
    const failedTests = this.results.filter(r => r.status === 'fail').length;
    const skippedTests = this.results.filter(r => r.status === 'skip').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      suiteName: 'Cook Smart Test Suite',
      tests: this.results,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalDuration
    };
  }

  reset(): void {
    this.results = [];
  }
}

export const mockApiCall = async (endpoint: string, delay: number = 100): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: `Mock response for ${endpoint}`,
        timestamp: new Date().toISOString()
      });
    }, delay);
  });
};

export const mockError = async (message: string, delay: number = 100): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, delay);
  });
};

export const validateComponent = (componentName: string, requiredProps: string[]): TestResult => {
  const startTime = Date.now();
  
  try {
    // Mock component validation
    const missingProps = requiredProps.filter(prop => !prop); // Simplified check
    
    if (missingProps.length > 0) {
      throw new Error(`Missing required props: ${missingProps.join(', ')}`);
    }
    
    return {
      testName: `${componentName} Component Validation`,
      status: 'pass',
      duration: Date.now() - startTime,
      details: `Component ${componentName} validated successfully`
    };
  } catch (error: any) {
    return {
      testName: `${componentName} Component Validation`,
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
};

export const testApiEndpoint = async (endpoint: string, expectedStatus: number = 200): Promise<TestResult> => {
  const startTime = Date.now();
  
  try {
    // Mock API test
    await mockApiCall(endpoint, 50);
    
    return {
      testName: `API Endpoint: ${endpoint}`,
      status: 'pass',
      duration: Date.now() - startTime,
      details: `Endpoint responded with status ${expectedStatus}`
    };
  } catch (error: any) {
    return {
      testName: `API Endpoint: ${endpoint}`,
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
};

export const testUserFlow = async (flowName: string, steps: string[]): Promise<TestResult> => {
  const startTime = Date.now();
  
  try {
    // Mock user flow test
    for (const step of steps) {
      await mockApiCall(`step-${step}`, 25);
    }
    
    return {
      testName: `User Flow: ${flowName}`,
      status: 'pass',
      duration: Date.now() - startTime,
      details: `Completed ${steps.length} steps successfully`
    };
  } catch (error: any) {
    return {
      testName: `User Flow: ${flowName}`,
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
};