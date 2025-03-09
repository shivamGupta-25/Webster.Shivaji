/**
 * Performance Utility Functions
 * 
 * This module provides utility functions for performance optimization
 * including caching, memoization, and other performance-related helpers.
 */

/**
 * Simple in-memory cache with TTL
 */
export class MemoryCache {
  constructor(ttlMs = 60 * 60 * 1000) { // Default TTL: 1 hour
    this.cache = new Map();
    this.ttlMs = ttlMs;
    this.lastCleanup = Date.now();
    this.cleanupInterval = 10 * 60 * 1000; // Clean up every 10 minutes
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any} - Cached value or undefined if not found or expired
   */
  get(key) {
    this.checkCleanup();

    const item = this.cache.get(key);
    if (!item) return undefined;

    const now = Date.now();
    if (now > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} [ttlMs] - Custom TTL in milliseconds
   */
  set(key, value, ttlMs) {
    const expiry = Date.now() + (ttlMs || this.ttlMs);
    this.cache.set(key, { value, expiry });
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} - Whether the key exists and is not expired
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Check if cleanup is needed and perform it if necessary
   */
  checkCleanup() {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.cleanup();
      this.lastCleanup = now;
    }
  }

  /**
   * Clean up expired items from the cache
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Create a memoized version of a function with TTL
 * @param {Function} fn - Function to memoize
 * @param {Object} options - Memoization options
 * @param {number} options.ttlMs - TTL in milliseconds
 * @param {Function} options.keyFn - Function to generate cache key from arguments
 * @returns {Function} - Memoized function
 */
export const memoizeWithTTL = (fn, options = {}) => {
  const cache = new MemoryCache(options.ttlMs);
  const keyFn = options.keyFn || ((...args) => JSON.stringify(args));

  return (...args) => {
    const key = keyFn(...args);
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Create a debounced version of a function
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (fn, wait = 300) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      fn(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Create a throttled version of a function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (fn, limit = 300) => {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Measure the execution time of a function
 * @param {Function} fn - Function to measure
 * @param {any[]} args - Arguments to pass to the function
 * @returns {Object} - Result and execution time
 */
export const measureExecutionTime = (fn, ...args) => {
  const start = performance.now();
  const result = fn(...args);
  const end = performance.now();

  return {
    result,
    executionTime: end - start
  };
};