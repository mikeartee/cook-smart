import { PaymentError } from '../components/PaymentErrorModal';

export class PaymentErrorHandler {
  static parseError(error: unknown): PaymentError {
    // Handle different error types from various sources
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { data?: { error?: string } } };
      if (err.response?.data?.error) {
        return this.parseAPIError(err.response.data.error);
      }
    }
    
    if (error instanceof Error && error.message) {
      return this.parseGenericError(error.message);
    }
    
    return {
      type: 'server_error',
      message: 'An unexpected error occurred',
      retryable: true
    };
  }

  private static parseAPIError(errorMessage: string): PaymentError {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('card') && message.includes('declined')) {
      return {
        type: 'card_declined',
        message: 'Your card was declined by your bank',
        retryable: true
      };
    }
    
    if (message.includes('insufficient') || message.includes('funds')) {
      return {
        type: 'insufficient_funds',
        message: 'Insufficient funds on your card',
        retryable: true
      };
    }
    
    if (message.includes('expired') || message.includes('expiry')) {
      return {
        type: 'expired_card',
        message: 'Your card has expired',
        retryable: true
      };
    }
    
    if (message.includes('invalid') || message.includes('validation')) {
      return {
        type: 'validation_error',
        message: 'Please check your payment information',
        retryable: true
      };
    }
    
    return {
      type: 'server_error',
      message: errorMessage,
      retryable: true
    };
  }

  private static parseGenericError(errorMessage: string): PaymentError {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      return {
        type: 'network_error',
        message: 'Network connection error',
        retryable: true
      };
    }
    
    if (message.includes('timeout')) {
      return {
        type: 'network_error',
        message: 'Request timed out',
        retryable: true
      };
    }
    
    return {
      type: 'server_error',
      message: errorMessage,
      retryable: true
    };
  }

  static getRetryDelay(attemptCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attemptCount), 30000);
  }

  static shouldRetry(error: PaymentError, attemptCount: number): boolean {
    if (!error.retryable || attemptCount >= 3) {
      return false;
    }
    
    // Don't auto-retry validation errors
    if (error.type === 'validation_error') {
      return false;
    }
    
    return true;
  }

  static logError(error: PaymentError, context: string) {
    console.error(`Payment Error [${context}]:`, {
      type: error.type,
      message: error.message,
      code: error.code,
      retryable: error.retryable,
      timestamp: new Date().toISOString()
    });
  }
}