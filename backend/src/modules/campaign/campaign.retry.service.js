/**
 * Campaign Discovery Retry Service
 * Provides retry logic with exponential backoff for database operations
 * and external service calls
 */
class CampaignRetryService {
  constructor() {
    this.DEFAULT_MAX_RETRIES = 3;
    this.DEFAULT_BASE_DELAY = 1000; // 1 second
    this.DEFAULT_MAX_DELAY = 10000; // 10 seconds
    this.DEFAULT_BACKOFF_FACTOR = 2;
  }

  /**
   * Execute operation with exponential backoff retry
   * @param {Function} operation - Async operation to retry
   * @param {Object} options - Retry options
   * @returns {Promise} - Operation result
   */
  async executeWithRetry(operation, options = {}) {
    const {
      maxRetries = this.DEFAULT_MAX_RETRIES,
      baseDelay = this.DEFAULT_BASE_DELAY,
      maxDelay = this.DEFAULT_MAX_DELAY,
      backoffFactor = this.DEFAULT_BACKOFF_FACTOR,
      retryCondition = this.defaultRetryCondition,
      operationName = "Unknown Operation",
    } = options;

    let lastError;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const result = await operation();

        // Log successful retry if this wasn't the first attempt
        if (attempt > 0) {
          console.log(
            `[CampaignRetryService] ${operationName} succeeded on attempt ${attempt + 1}`,
          );
        }

        return result;
      } catch (error) {
        lastError = error;
        attempt++;

        // Check if we should retry this error
        if (!retryCondition(error)) {
          console.log(
            `[CampaignRetryService] ${operationName} failed with non-retryable error:`,
            error.message,
          );
          throw error;
        }

        // Check if we've exhausted retries
        if (attempt > maxRetries) {
          console.error(
            `[CampaignRetryService] ${operationName} failed after ${maxRetries + 1} attempts:`,
            error.message,
          );
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt - 1),
          maxDelay,
        );

        // Add jitter (±25% of delay)
        const jitter = delay * 0.25 * (Math.random() * 2 - 1);
        const finalDelay = Math.max(0, delay + jitter);

        console.warn(
          `[CampaignRetryService] ${operationName} failed on attempt ${attempt}, retrying in ${Math.round(finalDelay)}ms:`,
          error.message,
        );

        await this.sleep(finalDelay);
      }
    }

    // All retries exhausted, throw the last error
    throw lastError;
  }

  /**
   * Default retry condition - retries on database and network errors
   * @param {Error} error - Error to check
   * @returns {Boolean} - Whether to retry
   */
  defaultRetryCondition(error) {
    // Don't retry validation errors or client errors
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return false;
    }

    // Don't retry authentication/authorization errors
    if (
      error.code === "AUTHENTICATION_ERROR" ||
      error.code === "AUTHORIZATION_ERROR"
    ) {
      return false;
    }

    // Retry on database connection errors
    if (
      error.name === "MongoNetworkError" ||
      error.name === "MongoTimeoutError" ||
      error.name === "MongoServerSelectionError"
    ) {
      return true;
    }

    // Retry on Redis connection errors
    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ENOTFOUND" ||
      error.code === "ETIMEDOUT"
    ) {
      return true;
    }

    // Retry on temporary server errors
    if (error.statusCode >= 500) {
      return true;
    }

    // Retry on timeout errors
    if (error.message && error.message.includes("timeout")) {
      return true;
    }

    // Don't retry other errors by default
    return false;
  }

  /**
   * Database-specific retry condition
   * @param {Error} error - Error to check
   * @returns {Boolean} - Whether to retry
   */
  databaseRetryCondition(error) {
    // Retry on connection errors
    if (
      error.name === "MongoNetworkError" ||
      error.name === "MongoTimeoutError" ||
      error.name === "MongoServerSelectionError" ||
      error.name === "MongoWriteConcernError"
    ) {
      return true;
    }

    // Retry on temporary MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error - don't retry
      return false;
    }

    if (
      error.code === 16500 || // Exceeded time limit
      error.code === 50
    ) {
      // Exceeded memory limit
      return true;
    }

    return this.defaultRetryCondition(error);
  }

  /**
   * Cache-specific retry condition
   * @param {Error} error - Error to check
   * @returns {Boolean} - Whether to retry
   */
  cacheRetryCondition(error) {
    // Retry on Redis connection errors
    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ENOTFOUND" ||
      error.code === "ETIMEDOUT" ||
      error.code === "EPIPE"
    ) {
      return true;
    }

    // Don't retry Redis command errors (syntax, etc.)
    if (error.command) {
      return false;
    }

    return this.defaultRetryCondition(error);
  }

  /**
   * Trust Engine specific retry condition
   * @param {Error} error - Error to check
   * @returns {Boolean} - Whether to retry
   */
  trustEngineRetryCondition(error) {
    // Don't retry if trust engine is completely unavailable
    if (error.message && error.message.includes("Trust Engine unavailable")) {
      return false;
    }

    // Retry on temporary calculation errors
    if (error.message && error.message.includes("calculation failed")) {
      return true;
    }

    return this.defaultRetryCondition(error);
  }

  /**
   * Execute database operation with retry
   * @param {Function} operation - Database operation
   * @param {String} operationName - Operation name for logging
   * @returns {Promise} - Operation result
   */
  async executeDbOperation(operation, operationName = "Database Operation") {
    return this.executeWithRetry(operation, {
      maxRetries: 3,
      baseDelay: 1000,
      retryCondition: this.databaseRetryCondition.bind(this),
      operationName,
    });
  }

  /**
   * Execute cache operation with retry
   * @param {Function} operation - Cache operation
   * @param {String} operationName - Operation name for logging
   * @returns {Promise} - Operation result
   */
  async executeCacheOperation(operation, operationName = "Cache Operation") {
    return this.executeWithRetry(operation, {
      maxRetries: 2, // Fewer retries for cache operations
      baseDelay: 500,
      maxDelay: 2000,
      retryCondition: this.cacheRetryCondition.bind(this),
      operationName,
    });
  }

  /**
   * Execute trust engine operation with retry
   * @param {Function} operation - Trust engine operation
   * @param {String} operationName - Operation name for logging
   * @returns {Promise} - Operation result
   */
  async executeTrustOperation(
    operation,
    operationName = "Trust Engine Operation",
  ) {
    return this.executeWithRetry(operation, {
      maxRetries: 2,
      baseDelay: 2000,
      retryCondition: this.trustEngineRetryCondition.bind(this),
      operationName,
    });
  }

  /**
   * Execute operation with circuit breaker pattern
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Circuit breaker options
   * @returns {Promise} - Operation result
   */
  async executeWithCircuitBreaker(operation, options = {}) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000, // 1 minute
      operationName = "Unknown Operation",
    } = options;

    // Simple circuit breaker implementation
    // In production, consider using a more sophisticated library
    const circuitKey = `circuit_${operationName}`;

    if (!this.circuits) {
      this.circuits = new Map();
    }

    let circuit = this.circuits.get(circuitKey);
    if (!circuit) {
      circuit = {
        state: "CLOSED", // CLOSED, OPEN, HALF_OPEN
        failureCount: 0,
        lastFailureTime: null,
      };
      this.circuits.set(circuitKey, circuit);
    }

    // Check circuit state
    if (circuit.state === "OPEN") {
      const timeSinceLastFailure = Date.now() - circuit.lastFailureTime;
      if (timeSinceLastFailure < resetTimeout) {
        throw new Error(`Circuit breaker is OPEN for ${operationName}`);
      } else {
        // Try to reset circuit
        circuit.state = "HALF_OPEN";
        console.log(
          `[CampaignRetryService] Circuit breaker for ${operationName} is now HALF_OPEN`,
        );
      }
    }

    try {
      const result = await operation();

      // Success - reset circuit if it was half-open
      if (circuit.state === "HALF_OPEN") {
        circuit.state = "CLOSED";
        circuit.failureCount = 0;
        console.log(
          `[CampaignRetryService] Circuit breaker for ${operationName} is now CLOSED`,
        );
      }

      return result;
    } catch (error) {
      // Failure - update circuit state
      circuit.failureCount++;
      circuit.lastFailureTime = Date.now();

      if (circuit.failureCount >= failureThreshold) {
        circuit.state = "OPEN";
        console.error(
          `[CampaignRetryService] Circuit breaker for ${operationName} is now OPEN`,
        );
      }

      throw error;
    }
  }

  /**
   * Sleep for specified milliseconds
   * @param {Number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get circuit breaker status for monitoring
   * @returns {Object} - Circuit breaker statuses
   */
  getCircuitStatus() {
    if (!this.circuits) {
      return {};
    }

    const status = {};
    for (const [key, circuit] of this.circuits.entries()) {
      status[key] = {
        state: circuit.state,
        failureCount: circuit.failureCount,
        lastFailureTime: circuit.lastFailureTime,
      };
    }

    return status;
  }
}

export default new CampaignRetryService();
