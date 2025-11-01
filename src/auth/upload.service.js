import cloudinary from '../lib/cloudinary.js';
import { Readable } from 'stream';

const uploadImage = async (fileBuffer, folder = 'profiles') => {

    try {
        
        const stream = Readable.from(fileBuffer);

        return new Promise((resolve, reject) => {

        
        const uploadStream = cloudinary.uploader.upload_stream(
            { 
                folder: folder,
                resource_type: 'auto',
                transformation: [
                    { width: 500, height: 500, crop: 'limit' },
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ],
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.pipe(uploadStream);
    });

    } catch (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }
}

export default {
    uploadImage
};