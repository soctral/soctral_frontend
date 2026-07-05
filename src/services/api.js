// ========================================
// services/api.js - E2E encryption enabled: only health/docs/encryption excluded
// ========================================

import { API_BASE_URL } from "../config.js";

// Lazy-load encryption to avoid "Cannot access before initialization" (circular/init order)
let _encryptionService = null;
async function getEncryptionService() {
  if (!_encryptionService) {
    const mod = await import("./encryption.service.js");
    _encryptionService = mod.default;
  }
  return _encryptionService;
}

// Lazy-load authService to avoid circular import (authService also lazy-imports api.js)
let _authService = null;
async function getAuthService() {
  if (!_authService) {
    const mod = await import("./authService.js");
    _authService = mod.default;
  }
  return _authService;
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Only these paths skip encryption/decryption (public or key-exchange)
    this.excludedPaths = [
      "/health",
      "/api/docs",
      "/metrics",
      "/encryption",
      "/docs",
    ];
  }

  // Get auth token from storage
  getAuthToken() {
    try {
      return localStorage.getItem("authToken");
    } catch (error) {
      console.warn("⚠️ Could not access localStorage for token");
      return null;
    }
  }

  // Get headers with auth token
  getHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };

    const token = this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  // 🔥 FIXED: Better exclusion check
  shouldSkipEncryption(endpoint) {
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

    return this.excludedPaths.some((path) => {
      // Exact match or starts with (for paths with query params or sub-paths)
      return (
        normalizedEndpoint === path ||
        normalizedEndpoint.startsWith(path + "?") ||
        normalizedEndpoint.startsWith(path + "/") ||
        (path.endsWith("/") && normalizedEndpoint.startsWith(path))
      );
    });
  }

  // Encrypt request data (async for lazy encryption service)
  async encryptRequestData(data, method, endpoint) {
    // Skip encryption for excluded endpoints or non-mutating methods
    if (
      this.shouldSkipEncryption(endpoint) ||
      !["POST", "PUT", "PATCH"].includes(method.toUpperCase())
    ) {
      return typeof data === "string" ? data : null;
    }

    try {
      const encryptionService = await getEncryptionService();
      const dataToEncrypt = typeof data === "string" ? JSON.parse(data) : data;
      const encrypted = encryptionService.encrypt(dataToEncrypt);
      return JSON.stringify({ data: encrypted });
    } catch (error) {
      console.warn(
        "⚠️ Request encryption failed, sending unencrypted:",
        error.message,
      );
      return typeof data === "string" ? data : null;
    }
  }

  async decryptResponseData(data, endpoint) {
    // 🔥 CRITICAL FIX: Force decrypt for auth and wallet-info if data is encrypted
    const forceDecryptPaths = [
      "/auth/login",
      "/auth/create",
      "/auth/signupWithGoogle",
      "/auth/refresh",
      "/user/wallet-info",
    ];
    const shouldForceDecrypt = forceDecryptPaths.some((path) =>
      endpoint.startsWith(path) || endpoint.includes(path),
    );

    // If this path returns encrypted payload, force decrypt
    if (
      shouldForceDecrypt &&
      data &&
      typeof data === "object" &&
      data.data &&
      typeof data.data === "string"
    ) {
      console.warn(
        `⚠️ ${endpoint} returned encrypted data - decrypting on frontend`,
      );
      try {
        const encryptionService = await getEncryptionService();
        const decrypted = encryptionService.decrypt(data.data);
        return decrypted;
      } catch (error) {
        console.error(`❌ Forced decryption failed for ${endpoint}:`, error);
        // Return original data if decryption fails
        return data;
      }
    }

    // Skip decryption for excluded endpoints (normal case)
    if (this.shouldSkipEncryption(endpoint)) {
      return data;
    }

    // Check if response has encrypted data
    if (
      data &&
      typeof data === "object" &&
      data.data &&
      typeof data.data === "string"
    ) {
      try {
        const encryptionService = await getEncryptionService();
        const decrypted = encryptionService.decrypt(data.data);
        return decrypted;
      } catch (error) {
        console.warn(
          "⚠️ Response decryption failed, returning original:",
          error.message,
        );
        return data;
      }
    }

    return data;
  }

  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const method = options.method || "GET";

      // 🔥 FIX: Check if body is FormData - if so, handle differently
      const isFormData = options.body instanceof FormData;

      const config = {
        method: method,
        // 🔥 FIX: Don't set Content-Type for FormData - browser sets it with boundary
        headers: isFormData ? {} : this.getHeaders(options.headers),
        ...options,
      };

      // 🔥 FIX: Add Authorization header for FormData separately
      if (isFormData) {
        const token = this.getAuthToken();
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        // Add any custom headers passed in options (except Content-Type)
        if (options.headers) {
          Object.keys(options.headers).forEach((key) => {
            if (key.toLowerCase() !== "content-type") {
              config.headers[key] = options.headers[key];
            }
          });
        }
      }

      // Encrypt request body for POST, PUT, PATCH - but NOT for FormData
      if (
        config.body &&
        ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) &&
        !isFormData
      ) {
        let bodyData = config.body;
        if (typeof bodyData === "string") {
          try {
            bodyData = JSON.parse(bodyData);
          } catch (e) {
            // Already parsed or not JSON
          }
        }

        const encryptedBody = await this.encryptRequestData(
          bodyData,
          method,
          endpoint,
        );

        if (encryptedBody !== null) {
          config.body = encryptedBody;
        } else {
          config.body =
            typeof bodyData === "string" ? bodyData : JSON.stringify(bodyData);
        }
      }
      // 🔥 FIX: For FormData, don't modify the body - it's already ready

      const response = await fetch(url, config);
      const responseClone = response.clone();

      // Parse response
      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Try to decrypt data (only if not excluded)
      try {
        data = await this.decryptResponseData(data, endpoint);
      } catch (decryptError) {
        console.warn(
          "⚠️ Decryption failed, using raw data:",
          decryptError.message,
        );
      }

      // Handle error responses
      if (!response.ok) {
        // Auto-refresh on 401 (expired token) — retry the original request once
        if (response.status === 401 && !options._isRetry) {
          try {
            const authService = await getAuthService();
            await authService.refreshToken();
            return this.request(endpoint, { ...options, _isRetry: true });
          } catch (_refreshErr) {
            // Refresh failed — fall through to throw the 401 error normally
          }
        }

        let rawResponseText = "";
        try {
          rawResponseText = await responseClone.text();
        } catch (e) {
          // Silent
        }

        let errorMessage;
        let errorDetails = {};

        if (typeof data === "object" && data !== null) {
          errorMessage =
            data.message ||
            data.error ||
            data.msg ||
            data.details ||
            "Unknown error";
          errorDetails = {
            message: data.message,
            error: data.error,
            msg: data.msg,
            details: data.details,
            statusCode: data.statusCode,
            errors: data.errors,
            fieldErrors: data.fieldErrors,
            stack: data.stack,
            fullResponse: data,
          };
        } else if (typeof data === "string" && data.trim().length > 0) {
          errorMessage = data;
          errorDetails.rawString = data;
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        // Silent handling for "no data" errors
        const isNoDataError =
          response.status === 500 &&
          errorMessage.includes("Failed to retrieve transaction");

        // 🔥 404 on GET /channels/:id/metadata is expected (no metadata yet) — return null instead of throwing
        const isChannelMetadata404 =
          config.method === "GET" &&
          response.status === 404 &&
          endpoint.includes("/channels/") &&
          endpoint.endsWith("/metadata");
        if (isChannelMetadata404) {
          return null;
        }

        if (!isNoDataError) {
          console.error(`❌ API Error: ${config.method} ${url}`);
          console.error("❌ Error Message:", errorMessage);
          console.error("❌ Status:", response.status, response.statusText);
          console.error("❌ Error Details:", errorDetails);
        }

        // 🔥 Create error with full response data attached
        const apiError = new Error(errorMessage);
        apiError.data = data; // Attach full response data
        apiError.response = { data: data, status: response.status };
        throw apiError;
      }

      return data;
    } catch (error) {
      const isNoDataError = error.message.includes(
        "Failed to retrieve transaction",
      );

      if (!isNoDataError) {
        console.error(`❌ API Request failed: ${endpoint}`, error);
      }

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error("Network error: Please check your internet connection");
      }

      if (error.name === "AbortError") {
        throw new Error("Request timeout: Please try again");
      }

      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  // POST request
  async post(endpoint, data = null, options = {}) {
    const config = {
      ...options,
      method: "POST",
    };

    if (data) {
      config.body = typeof data === "string" ? data : JSON.stringify(data);
    }

    return this.request(endpoint, config);
  }

  // PUT request
  async put(endpoint, data = null, options = {}) {
    const config = {
      ...options,
      method: "PUT",
    };

    if (data) {
      config.body = typeof data === "string" ? data : JSON.stringify(data);
    }

    return this.request(endpoint, config);
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }

  // PATCH request
  async patch(endpoint, data = null, options = {}) {
    const config = {
      ...options,
      method: "PATCH",
    };

    if (data) {
      config.body = typeof data === "string" ? data : JSON.stringify(data);
    }

    return this.request(endpoint, config);
  }

  // Request with timeout
  async requestWithTimeout(endpoint, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await this.request(endpoint, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Upload file (no encryption for multipart/form-data)
  async uploadFile(endpoint, file, additionalData = {}) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      Object.keys(additionalData).forEach((key) => {
        formData.append(key, additionalData[key]);
      });

      const headers = {};
      const token = this.getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await this.request(endpoint, {
        method: "POST",
        body: formData,
        headers,
      });

      return response;
    } catch (error) {
      console.error("❌ File upload failed:", error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get("/health");
      return response;
    } catch (error) {
      console.error("❌ API Health Check failed:", error);
      throw error;
    }
  }

  // Set base URL
  setBaseURL(url) {
    this.baseURL = url;
  }

  // Get current base URL
  getBaseURL() {
    return this.baseURL;
  }
}

export default new ApiService();
