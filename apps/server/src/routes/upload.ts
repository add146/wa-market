import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, adminMiddleware } from '../middleware';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for memory storage (so we can process with sharp)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
        // Allow only images
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
        }
    },
});

/**
 * POST /api/upload
 * Upload and compress image (Admin only)
 * Compresses to 30% quality
 */
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        // Generate unique filename
        const ext = '.webp'; // Convert all to webp for better compression
        const filename = `${uuidv4()}${ext}`;
        const filepath = path.join(uploadsDir, filename);

        // Compress image with sharp - 30% quality
        await sharp(req.file.buffer)
            .webp({ quality: 30 })
            .toFile(filepath);

        // Return the URL path
        const imageUrl = `/uploads/${filename}`;

        res.json({
            success: true,
            url: imageUrl,
            filename,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

/**
 * POST /api/upload/multiple
 * Upload multiple images (Admin only)
 */
router.post('/multiple', authMiddleware, adminMiddleware, upload.array('images', 10), async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No image files provided' });
            return;
        }

        const uploadedUrls: string[] = [];

        for (const file of files) {
            const filename = `${uuidv4()}.webp`;
            const filepath = path.join(uploadsDir, filename);

            // Compress to 30% quality
            await sharp(file.buffer)
                .webp({ quality: 30 })
                .toFile(filepath);

            uploadedUrls.push(`/uploads/${filename}`);
        }

        res.json({
            success: true,
            urls: uploadedUrls,
        });
    } catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
});

/**
 * DELETE /api/upload/:filename
 * Delete an uploaded image (Admin only)
 */
router.delete('/:filename', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        const filepath = path.join(uploadsDir, filename);

        // Security check - prevent path traversal
        if (!filepath.startsWith(uploadsDir)) {
            res.status(400).json({ error: 'Invalid filename' });
            return;
        }

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            res.json({ success: true, message: 'Image deleted' });
        } else {
            res.status(404).json({ error: 'Image not found' });
        }
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

export default router;
