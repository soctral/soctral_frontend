// ========================================
// services/encryption.service.js - Encryption Service
// ========================================

import CryptoJS from 'crypto-js';

class EncryptionService {
  constructor() {
    // Get encryption key and IV from environment variables (Vite uses import.meta.env)
    const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;
    const encryptionIV = import.meta.env.VITE_ENCRYPTION_IV;

    if (!encryptionKey || !encryptionIV) {
      throw new Error(
        'VITE_ENCRYPTION_KEY and VITE_ENCRYPTION_IV must be set in environment variables'
      );
    }

    this.algorithm = 'AES';
    this.key = encryptionKey;
    this.iv = encryptionIV;
  }

  /**
   * Encrypt data using AES-256-CBC
   * @param {any} data - Data to encrypt (any type, will be JSON stringified)
   * @returns {string} Encrypted string (base64)
   */
  encrypt(data) {
    try {
      // Convert data to JSON string
      const plaintext = JSON.stringify(data);

      // Convert hex key and IV to WordArray
      const key = CryptoJS.enc.Hex.parse(this.key);
      const iv = CryptoJS.enc.Hex.parse(this.iv);

      // Encrypt using AES-CBC
      const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Return base64 encrypted string
      return encrypted.toString();
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt data using AES-256-CBC
   * @param {string} encrypted - Encrypted string (base64)
   * @returns {any} Decrypted data (parsed from JSON)
   */
  decrypt(encrypted) {
    try {
      // Convert hex key and IV to WordArray
      const key = CryptoJS.enc.Hex.parse(this.key);
      const iv = CryptoJS.enc.Hex.parse(this.iv);

      // Decrypt using AES-CBC
      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Convert to string and parse JSON
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedText) {
        throw new Error('Decryption failed: Invalid encrypted string');
      }

      return JSON.parse(decryptedText);
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }
}

// Export singleton instance
export default new EncryptionService();