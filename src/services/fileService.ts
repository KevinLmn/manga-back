import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { FileSystemError } from '../utils.js'

export class FileService {
  private readonly imagesDir: string

  constructor() {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    this.imagesDir = path.join(__dirname, '..', 'images')
    this.ensureImagesDirectory()
  }

  private ensureImagesDirectory(): void {
    try {
      if (!fs.existsSync(this.imagesDir)) {
        fs.mkdirSync(this.imagesDir, { recursive: true })
      }
    } catch (error) {
      throw new FileSystemError(
        `Failed to create images directory: ${error.message}`
      )
    }
  }

  saveImage(buffer: Buffer, filename: string): string {
    try {
      const filePath = path.join(this.imagesDir, filename)
      fs.writeFileSync(filePath, buffer)
      return filePath
    } catch (error) {
      throw new FileSystemError(
        `Failed to save image ${filename}: ${error.message}`
      )
    }
  }

  getImagePath(filename: string): string {
    return path.join(this.imagesDir, filename)
  }

  imageExists(filename: string): boolean {
    try {
      return fs.existsSync(this.getImagePath(filename))
    } catch (error) {
      throw new FileSystemError(
        `Failed to check if image exists ${filename}: ${error.message}`
      )
    }
  }

  deleteImage(filename: string): void {
    try {
      const filePath = this.getImagePath(filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      throw new FileSystemError(
        `Failed to delete image ${filename}: ${error.message}`
      )
    }
  }
}
