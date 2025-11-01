import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/dbHelper.js';
import uploadService from './upload.service.js';

export const registerService = async (email, first_name, last_name, password) => {
  const result = await db.query(
    'SELECT * FROM "User" WHERE email = $1',
    [email]
  );
  
  if (result.rows.length > 0) {
    throw new Error('Email sudah terdaftar');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const insertResult = await db.query(
    'INSERT INTO "User" (email, "first_name", "last_name", password, balance, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
    [email, first_name, last_name, hashedPassword, 0]
  );
  
  return insertResult.rows[0];
};

export const loginService = async (email, password) => {
  const result = await db.query(
    'SELECT * FROM "User" WHERE email = $1',
    [email]
  );
  
  const user = result.rows[0];
  if (!user) {
    throw new Error('email atau password salah');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('email atau password salah');
  }

  const token = jwt.sign({ sub: user.id }, process.env.JSON_WEB_TOKEN, { expiresIn: '30d' });
  return { token, user };
};

export const getProfileService = async (userId) => {
  const result = await db.query(
    'SELECT * FROM "User" WHERE id = $1',
    [userId]
  );
  
  const user = result.rows[0];
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
};

export const updateProfileService = async (userId, first_name, last_name) => {
  const result = await db.query(
    'UPDATE "User" SET "first_name" = $1, "last_name" = $2, "updatedAt" = NOW() WHERE id = $3 RETURNING *',
    [first_name, last_name, userId]
  );
  
  return result.rows[0];
};

export const updateProfileImageService = async (userId, data, imageFile) => {
  try {
    let imageUrl = null;

    if (imageFile && imageFile.buffer) {
      console.log('Uploading image to Cloudinary...');
      
      const uploadResult = await uploadService.uploadImage(
        imageFile.buffer,
        'profiles'
      );
      
      console.log('Upload success:', uploadResult.secure_url);
      imageUrl = uploadResult.secure_url;
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.first_name) {
      updates.push(`first_name = $${paramCount}`);
      values.push(data.first_name);
      paramCount++;
    }

    if (data.last_name) {
      updates.push(`last_name = $${paramCount}`);
      values.push(data.last_name);
      paramCount++;
    }

    if (imageUrl) {
      updates.push(`profile_image = $${paramCount}`);
      values.push(imageUrl);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`"updatedAt" = NOW()`);
    values.push(userId);

    const query = `UPDATE "User" SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};