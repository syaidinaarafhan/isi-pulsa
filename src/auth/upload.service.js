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
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(error);
                    } else {
                        console.log('Cloudinary upload success:', result.secure_url);
                        resolve(result);
                    }
                }
            );
            
            stream.pipe(uploadStream);
        });

    } catch (error) {
        console.error('❌ Upload failed:', error);
        throw new Error(`Upload failed: ${error.message}`);
    }
}

export default {
    uploadImage
};