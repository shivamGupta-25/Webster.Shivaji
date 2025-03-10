/**
 * File Utility Functions
 * 
 * This module provides utility functions for file handling and validation
 * to improve performance and code organization.
 */

// Constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

/**
 * Validates a file against size and type constraints
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSize - Maximum file size in bytes
 * @param {string[]} options.acceptedTypes - Array of accepted MIME types
 * @returns {Object} - Validation result with success flag and error message
 */
export const validateFile = (file, options = {}) => {
    const maxSize = options.maxSize || MAX_FILE_SIZE;
    const acceptedTypes = options.acceptedTypes || ACCEPTED_FILE_TYPES;

    if (!file) {
        return {
            success: false,
            error: 'No file provided'
        };
    }

    if (file.size > maxSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return {
            success: false,
            error: `File size (${sizeMB}MB) exceeds the maximum limit of ${maxSizeMB}MB. Please resize your file and try again.`
        };
    }

    if (!acceptedTypes.includes(file.type)) {
        return {
            success: false,
            error: `File type "${file.type}" not accepted. Allowed types: ${acceptedTypes.map(type => type.split('/')[1]).join(', ')}`
        };
    }

    return { success: true };
};

/**
 * Optimizes a file for upload by potentially resizing or compressing it
 * @param {File} file - The file to optimize
 * @returns {Promise<File|Blob>} - The optimized file or blob
 */
export const optimizeFile = async (file) => {
    // For now, just return the original file
    // In the future, this could implement image compression or resizing
    return file;
};

/**
 * Converts a file to a buffer
 * @param {File} file - The file to convert
 * @returns {Promise<Buffer>} - The file as a buffer
 */
export const fileToBuffer = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
};

/**
 * Generates a sanitized filename
 * @param {File} file - The original file
 * @param {string} prefix - Prefix to add to the filename
 * @param {Object} userData - User data to include in the filename
 * @returns {string} - The sanitized filename
 */
export const generateSanitizedFilename = (file, prefix, userData) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const eventName = userData.eventName || 'Unknown-Event';
    const sanitizedName = (userData.name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const sanitizedCollege = (userData.college || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const fileExtension = file.name.split('.').pop();

    return `${prefix}_${sanitizedName}_${sanitizedCollege}_${eventName}_${timestamp}.${fileExtension}`;
};

/**
 * Batch validates multiple files
 * @param {Object} files - Object containing files to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation results with success flag and errors
 */
export const batchValidateFiles = (files, options = {}) => {
    const results = {
        success: true,
        errors: []
    };

    for (const [key, file] of Object.entries(files)) {
        if (file) {
            const validation = validateFile(file, options);
            if (!validation.success) {
                results.success = false;
                results.errors.push({
                    field: key,
                    error: validation.error
                });
            }
        }
    }

    return results;
};