import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";
import { errorLogger, eventLogger } from "../config/logger";

/**
 * File upload security utilities
 * Implements comprehensive file validation and security checks
 */

export interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  scanForMalware?: boolean;
  quarantineSuspicious?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  fileType?: string;
  fileSize?: number;
  checksum?: string;
}

/**
 * Default secure file upload configuration
 */
export const DEFAULT_FILE_CONFIG: FileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  allowedExtensions: [
    'jpg', 'jpeg', 'png', 'gif', 'webp',
    'pdf', 'txt', 'doc', 'docx'
  ],
  scanForMalware: true,
  quarantineSuspicious: true
};

/**
 * Magic number patterns for file type detection
 */
const FILE_SIGNATURES: { [key: string]: { mimeType: string; patterns: number[][] } } = {
  'image/jpeg': {
    mimeType: 'image/jpeg',
    patterns: [
      [0xFF, 0xD8, 0xFF, 0xE0],
      [0xFF, 0xD8, 0xFF, 0xE1],
      [0xFF, 0xD8, 0xFF, 0xE2],
      [0xFF, 0xD8, 0xFF, 0xDB]
    ]
  },
  'image/png': {
    mimeType: 'image/png',
    patterns: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]]
  },
  'image/gif': {
    mimeType: 'image/gif',
    patterns: [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
    ]
  },
  'image/webp': {
    mimeType: 'image/webp',
    patterns: [[0x52, 0x49, 0x46, 0x46]] // RIFF
  },
  'application/pdf': {
    mimeType: 'application/pdf',
    patterns: [[0x25, 0x50, 0x44, 0x46]] // %PDF
  },
  'application/zip': {
    mimeType: 'application/zip',
    patterns: [[0x50, 0x4B, 0x03, 0x04]]
  }
};

/**
 * Dangerous file patterns that should be blocked
 */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /eval\s*\(/gi,
  /document\.write/gi,
  /window\.location/gi,
  /\.exe$/i,
  /\.bat$/i,
  /\.cmd$/i,
  /\.scr$/i,
  /\.pif$/i,
  /\.com$/i
];

/**
 * Validate file upload based on configuration
 */
export function validateFileUpload(
  fileData: string, // Base64 encoded file
  fileName: string,
  config: FileUploadConfig = DEFAULT_FILE_CONFIG
): FileValidationResult {
  const errors: string[] = [];
  
  try {
    // Decode base64 file
    const buffer = Buffer.from(fileData, 'base64');
    const fileSize = buffer.length;
    
    // Check file size
    if (fileSize > config.maxFileSize) {
      errors.push(`File size ${Math.round(fileSize / 1024)}KB exceeds maximum allowed size of ${Math.round(config.maxFileSize / 1024)}KB`);
    }
    
    // Check file extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension || !config.allowedExtensions.includes(extension)) {
      errors.push(`File extension '.${extension}' is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`);
    }
    
    // Detect file type from magic bytes
    const detectedType = detectFileType(buffer);
    if (!detectedType) {
      errors.push('Unable to determine file type from content');
    } else if (!config.allowedMimeTypes.includes(detectedType)) {
      errors.push(`File type '${detectedType}' is not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`);
    }
    
    // Scan for dangerous patterns
    const contentString = buffer.toString('utf8', 0, Math.min(buffer.length, 10000)); // Check first 10KB
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(contentString)) {
        errors.push(`File contains potentially dangerous content: ${pattern.toString()}`);
        
        // Log security event
        eventLogger("malicious_file_upload_attempt", {
          fileName,
          fileSize,
          detectedType,
          pattern: pattern.toString(),
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Generate file checksum
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    
    return {
      isValid: errors.length === 0,
      errors,
      fileType: detectedType || undefined,
      fileSize,
      checksum
    };
    
  } catch (error) {
    errorLogger(error as Error, {
      context: "file_validation",
      fileName,
      fileSize: fileData.length
    });
    
    return {
      isValid: false,
      errors: ['File validation failed due to processing error']
    };
  }
}

/**
 * Detect file type from magic bytes
 */
function detectFileType(buffer: Buffer): string | null {
  for (const [mimeType, signature] of Object.entries(FILE_SIGNATURES)) {
    for (const pattern of signature.patterns) {
      if (buffer.length >= pattern.length) {
        const matches = pattern.every((byte, index) => buffer[index] === byte);
        if (matches) {
          return mimeType;
        }
      }
    }
  }
  return null;
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .substring(0, 255) // Limit length
    .trim();
}

/**
 * Generate secure filename with timestamp and random component
 */
export function generateSecureFileName(originalName: string, userId?: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  const sanitizedBase = sanitizeFileName(originalName.split('.')[0]);
  
  return `${userId || 'anonymous'}_${timestamp}_${random}_${sanitizedBase}.${extension}`;
}

/**
 * File upload middleware factory
 */
export function createFileUploadMiddleware(config: FileUploadConfig = DEFAULT_FILE_CONFIG) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if file data exists in request body
      if (req.body && req.body.file) {
        const { file, fileName } = req.body;
        
        if (!fileName) {
          return res.status(400).json({
            message: "File name is required",
            error: "MISSING_FILE_NAME"
          });
        }
        
        // Validate file upload
        const validation = validateFileUpload(file, fileName, config);
        
        if (!validation.isValid) {
          errorLogger(new Error("File upload validation failed"), {
            context: "file_upload_middleware",
            fileName,
            errors: validation.errors,
            ip: req.ip
          });
          
          return res.status(400).json({
            message: "File upload validation failed",
            error: "INVALID_FILE",
            details: validation.errors
          });
        }
        
        // Add validation results to request
        req.body.fileValidation = validation;
        req.body.secureFileName = generateSecureFileName(fileName, (req as any).user?.id);
      }
      
      next();
    } catch (error) {
      errorLogger(error as Error, {
        context: "file_upload_middleware",
        ip: req.ip
      });
      
      res.status(400).json({
        message: "File upload processing failed",
        error: "FILE_PROCESSING_ERROR"
      });
    }
  };
}

/**
 * Scan file for malware patterns (basic implementation)
 */
export function scanForMalware(buffer: Buffer): { isClean: boolean; threats: string[] } {
  const threats: string[] = [];
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 50000)); // Check first 50KB
  
  // Basic malware patterns (in a real implementation, use a proper antivirus engine)
  const malwarePatterns = [
    /eval\s*\(/gi,
    /document\.write/gi,
    /window\.location/gi,
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi
  ];
  
  for (const pattern of malwarePatterns) {
    if (pattern.test(content)) {
      threats.push(`Potential malware pattern detected: ${pattern.toString()}`);
    }
  }
  
  return {
    isClean: threats.length === 0,
    threats
  };
}

/**
 * Quarantine suspicious files
 */
export function quarantineFile(fileName: string, reason: string): void {
  eventLogger("file_quarantined", {
    fileName,
    reason,
    timestamp: new Date().toISOString()
  });
  
  // In a real implementation, move file to quarantine directory
  // and notify security team
}
