import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
});

console.log('☁️ Cloudinary config:', cloudinary.config());

export default cloudinary;