import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "../utils/logger.js";

class FileStorageService {
  constructor() {
    this.storageType = process.env.STORAGE_TYPE || "LOCAL"; // LOCAL | S3
    this.localPath = process.env.UPLOAD_PATH || "./uploads/proofs";
    this.s3Bucket = process.env.S3_BUCKET;
    this.s3Region = process.env.S3_REGION || "us-east-1";
    this.s3Client = null;
    // Frontend and backend run on different origins in this app (see
    // frontend/src/services/api.js, which uses an absolute baseURL rather
    // than a same-origin/proxied path) - a bare "/uploads/..." path would
    // resolve against the frontend's own origin when used in an <img src>
    // and 404. Return an absolute URL pointing at this backend instead.
    this.publicUrl = (
      process.env.BACKEND_PUBLIC_URL ||
      `http://localhost:${process.env.PORT || 5000}`
    ).replace(/\/$/, "");

    if (this.storageType === "S3") {
      this.s3Client = new S3Client({
        region: this.s3Region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    } else {
      // Ensure local upload directory exists
      this.ensureLocalDirectory();
    }
  }

  async ensureLocalDirectory() {
    try {
      await fs.mkdir(this.localPath, { recursive: true });
    } catch (error) {
      logger.error({ type: "FILE_STORAGE_INIT_ERROR", error: error.message });
    }
  }

  /**
   * Generate unique filename with timestamp and random string
   * @param {string} originalFilename - Original file name
   * @returns {string} Unique filename
   */
  generateUniqueFilename(originalFilename) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9-_]/g, "_");
    return `${timestamp}-${randomString}-${sanitizedBasename}${ext}`;
  }

  /**
   * Compute SHA-256 hash of file content
   * @param {Buffer} fileBuffer - File content as buffer
   * @returns {string} SHA-256 hash (64 hex characters)
   */
  computeFileHash(fileBuffer) {
    return crypto.createHash("sha256").update(fileBuffer).digest("hex");
  }

  /**
   * Store file and return URL
   * @param {Buffer} fileBuffer - File content as buffer
   * @param {string} originalFilename - Original file name
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<string>} File URL
   */
  async storeFile(fileBuffer, originalFilename, mimeType) {
    const uniqueFilename = this.generateUniqueFilename(originalFilename);

    if (this.storageType === "LOCAL") {
      return await this.storeFileLocally(fileBuffer, uniqueFilename);
    } else {
      return await this.storeFileS3(fileBuffer, uniqueFilename, mimeType);
    }
  }

  /**
   * Store file locally
   * @param {Buffer} fileBuffer - File content
   * @param {string} filename - Unique filename
   * @returns {Promise<string>} File URL
   */
  async storeFileLocally(fileBuffer, filename) {
    try {
      const filepath = path.join(this.localPath, filename);
      await fs.writeFile(filepath, fileBuffer);
      return `${this.publicUrl}/uploads/proofs/${filename}`;
    } catch (error) {
      logger.error({
        type: "LOCAL_FILE_STORAGE_ERROR",
        filename,
        error: error.message,
      });
      throw new Error("File upload failed");
    }
  }

  /**
   * Store file in S3
   * @param {Buffer} fileBuffer - File content
   * @param {string} filename - Unique filename
   * @param {string} mimeType - MIME type
   * @returns {Promise<string>} S3 URL
   */
  async storeFileS3(fileBuffer, filename, mimeType) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: `proofs/${filename}`,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);
      return `s3://${this.s3Bucket}/proofs/${filename}`;
    } catch (error) {
      logger.error({
        type: "S3_FILE_STORAGE_ERROR",
        filename,
        error: error.message,
      });
      throw new Error("File upload failed");
    }
  }

  /**
   * Retrieve file from storage
   * @param {string} fileUrl - File URL
   * @returns {Promise<Buffer>} File content
   */
  async getFile(fileUrl) {
    if (fileUrl.startsWith("s3://")) {
      return await this.getFileS3(fileUrl);
    } else {
      return await this.getFileLocally(fileUrl);
    }
  }

  /**
   * Retrieve file from local storage
   * @param {string} fileUrl - Local file URL
   * @returns {Promise<Buffer>} File content
   */
  async getFileLocally(fileUrl) {
    try {
      const filename = path.basename(fileUrl);
      const filepath = path.join(this.localPath, filename);
      return await fs.readFile(filepath);
    } catch (error) {
      logger.error({
        type: "LOCAL_FILE_RETRIEVAL_ERROR",
        fileUrl,
        error: error.message,
      });
      throw new Error("File retrieval failed");
    }
  }

  /**
   * Retrieve file from S3
   * @param {string} fileUrl - S3 URL (s3://bucket/key)
   * @returns {Promise<Buffer>} File content
   */
  async getFileS3(fileUrl) {
    try {
      const key = fileUrl.replace(`s3://${this.s3Bucket}/`, "");
      const command = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      logger.error({
        type: "S3_FILE_RETRIEVAL_ERROR",
        fileUrl,
        error: error.message,
      });
      throw new Error("File retrieval failed");
    }
  }

  /**
   * Delete file from storage
   * @param {string} fileUrl - File URL
   * @returns {Promise<void>}
   */
  async deleteFile(fileUrl) {
    if (fileUrl.startsWith("s3://")) {
      return await this.deleteFileS3(fileUrl);
    } else {
      return await this.deleteFileLocally(fileUrl);
    }
  }

  /**
   * Delete file from local storage
   * @param {string} fileUrl - Local file URL
   * @returns {Promise<void>}
   */
  async deleteFileLocally(fileUrl) {
    try {
      const filename = path.basename(fileUrl);
      const filepath = path.join(this.localPath, filename);
      await fs.unlink(filepath);
    } catch (error) {
      logger.error({
        type: "LOCAL_FILE_DELETION_ERROR",
        fileUrl,
        error: error.message,
      });
      // Don't throw - deletion failure is not critical
    }
  }

  /**
   * Delete file from S3
   * @param {string} fileUrl - S3 URL
   * @returns {Promise<void>}
   */
  async deleteFileS3(fileUrl) {
    try {
      const key = fileUrl.replace(`s3://${this.s3Bucket}/`, "");
      const command = new DeleteObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      logger.error({
        type: "S3_FILE_DELETION_ERROR",
        fileUrl,
        error: error.message,
      });
      // Don't throw - deletion failure is not critical
    }
  }

  /**
   * Generate secure pre-signed URL for S3 files
   * @param {string} fileUrl - S3 URL
   * @param {number} expiresIn - Expiration time in seconds (default: 3600)
   * @returns {Promise<string>} Pre-signed URL
   */
  async generateSecureUrl(fileUrl, expiresIn = 3600) {
    if (!fileUrl.startsWith("s3://")) {
      return fileUrl; // Local files don't need pre-signed URLs
    }

    try {
      const key = fileUrl.replace(`s3://${this.s3Bucket}/`, "");
      const command = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      logger.error({
        type: "S3_PRESIGNED_URL_ERROR",
        fileUrl,
        error: error.message,
      });
      throw new Error("Failed to generate secure URL");
    }
  }
}

// Export singleton instance
export default new FileStorageService();
