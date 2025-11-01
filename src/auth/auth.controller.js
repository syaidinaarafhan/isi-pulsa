import * as authService from './auth.service.js';
import express from 'express';
import { authenticate } from './passport.js';
import upload from '../lib/multer.js';

const router = express.Router();

/**
 * @openapi
 * /register:
 *   post:
 *     tags:
 *       - 1. Module Membership
 *     description: |
 *       Endpoint ini digunakan untuk melakukan registrasi user baru agar dapat login ke dalam aplikasi.  
 *       **Tidak memerlukan Token.**
 *       
 *       Ketentuan:
 *       - Parameter `email` harus memiliki format email yang valid.
 *       - Parameter `password` minimal memiliki panjang **8 karakter**.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@nutech-integrasi.com
 *               first_name:
 *                 type: string
 *                 example: User
 *               last_name:
 *                 type: string
 *                 example: Nutech
 *               password:
 *                 type: string
 *                 example: abcdef1234
 *     responses:
 *       200:
 *         description: Request Successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 0
 *               message: Registrasi berhasil silahkan login
 *               data: null
 *       400:
 *         description: Bad Request (parameter tidak valid)
 *         content:
 *           application/json:
 *             example:
 *               status: 102
 *               message: Paramter email tidak sesuai format
 *               data: null
 */

router.post('/register', async (req, res) => {
  try {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
      return res.status(400).json({
        status: 101,
        message: 'Semua field wajib diisi (email, first_name, last_name, password)',
        data: null
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 102,
        message: 'Parameter email tidak sesuai format',
        data: null
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 103,
        message: 'Password minimal 8 karakter',
        data: null
      });
    }

    const newUser = await authService.registerService(email, first_name, last_name, password);

    return res.status(200).json({
      status: 0,
      message: 'Registrasi berhasil silahkan login',
      data: null
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.message === 'Email sudah terdaftar') {
      return res.status(400).json({
        status: 104,
        message: 'Email sudah terdaftar',
        data: null
      });
    }

    return res.status(500).json({
      status: 500,
      message: 'Terjadi kesalahan pada server',
      data: null
    });
  }
});

/**
 * @openapi
 * /login:
 *   post:
 *     tags:
 *       - 1. Module Membership
 *     description: |
 *       Endpoint ini digunakan untuk melakukan login dan mendapatkan authentication berupa **JWT (JSON Web Token)**.  
 *       **Tidak memerlukan Token untuk mengaksesnya.**
 *       
 *       Ketentuan:
 *       - Parameter `email` harus memiliki format email yang valid.
 *       - Parameter `password` minimal memiliki panjang **8 karakter**.
 *       - JWT yang dihasilkan harus memuat payload `email` dan memiliki masa berlaku **12 jam** sejak waktu generate.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@nutech-integrasi.com
 *               password:
 *                 type: string
 *                 example: abcdef1234
 *     responses:
 *       200:
 *         description: Berhasil Login
 *         content:
 *           application/json:
 *             example:
 *               status: 0
 *               message: Login Sukses
 *               data:
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Bad Request (parameter tidak valid)
 *         content:
 *           application/json:
 *             example:
 *               status: 102
 *               message: Paramter email tidak sesuai format
 *               data: null
 *       401:
 *         description: Unauthorized (email atau password salah)
 *         content:
 *           application/json:
 *             example:
 *               status: 103
 *               message: Username atau password salah
 *               data: null
 */

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 101,
        message: 'Email dan password wajib diisi',
        data: null
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 102,
        message: 'Parameter email tidak sesuai format',
        data: null
      });
    }

    const { token, user } = await authService.loginService(email, password);

    return res.status(200).json({
      status: 0,
      message: 'Login Sukses',
      data: { token }
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error.message === 'email atau password salah') {
      return res.status(401).json({
        status: 103,
        message: 'Email atau password salah',
        data: null
      });
    }

    return res.status(500).json({
      status: 500,
      message: 'Terjadi kesalahan pada server',
      data: null
    });
  }
});

/**
 * @openapi
 * /profile:
 *   get:
 *     tags:
 *       - 1. Module Membership
 *     description: |
 *       Endpoint ini digunakan untuk mendapatkan informasi profil user yang sedang login.  
 *       **Memerlukan Bearer Token (JWT)** untuk mengaksesnya.
 *       
 *       Ketentuan:
 *       - Service ini harus menggunakan Bearer Token JWT untuk mengaksesnya.  
 *       - Tidak ada parameter `email` di query param atau request body, karena data `email` diambil dari payload JWT hasil login.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Request Successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 0
 *               message: Sukses
 *               data:
 *                 email: user@nutech-integrasi.com
 *                 first_name: User
 *                 last_name: Nutech
 *                 profile_image: https://yoururlapi.com/profile.jpeg
 *       401:
 *         description: Unauthorized (Token tidak valid atau kadaluwarsa)
 *         content:
 *           application/json:
 *             example:
 *               status: 108
 *               message: Token tidak valid atau kadaluwarsa
 *               data: null
 */

router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await authService.getProfileService(userId);

    return res.status(200).json({
      status: 0,
      message: 'Sukses',
      data: {
        email: userProfile.email,
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        profile_image: userProfile.profile_image || null
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);

    return res.status(500).json({
      status: 500,
      message: 'Terjadi kesalahan pada server',
      data: null
    });
  }
});

/**
 * @openapi
 * /profile/update:
 *   put:
 *     tags:
 *       - 1. Module Membership
 *     description: |
 *       Endpoint ini digunakan untuk mengupdate data profil user yang sedang login.  
 *       **Memerlukan Bearer Token (JWT)** untuk mengaksesnya.  
 *       
 *       Ketentuan:
 *       - Service ini harus menggunakan Bearer Token JWT untuk mengaksesnya.  
 *       - Tidak ada parameter `email` di query param atau request body, karena data `email` diambil dari payload JWT hasil login.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: User Edited
 *               last_name:
 *                 type: string
 *                 example: Nutech Edited
 *     responses:
 *       200:
 *         description: Request Successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 0
 *               message: Update Profile berhasil
 *               data:
 *                 email: user@nutech-integrasi.com
 *                 first_name: User Edited
 *                 last_name: Nutech Edited
 *                 profile_image: https://yoururlapi.com/profile.jpeg
 *       401:
 *         description: Unauthorized (Token tidak valid atau kadaluwarsa)
 *         content:
 *           application/json:
 *             example:
 *               status: 108
 *               message: Token tidak valid atau kadaluwarsa
 *               data: null
 */

router.put('/profile/update', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({
        status: 104,
        message: 'First name dan last name wajib diisi',
        data: null
      });
    }

    if (first_name.trim().length < 2 || last_name.trim().length < 2) {
      return res.status(400).json({
        status: 105,
        message: 'First name dan last name minimal 2 karakter',
        data: null
      });
    }

    const updatedUser = await authService.updateProfileService(userId, first_name.trim(), last_name.trim());

    return res.status(200).json({
      status: 0,
      message: 'Update Profil berhasil',
      data: {
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        profile_image: updatedUser.profile_image || null
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);

    return res.status(500).json({
      status: 500,
      message: 'Terjadi kesalahan pada server',
      data: null
    });
  }
});

/**
 * @openapi
 * /profile/image:
 *   put:
 *     tags:
 *       - 1. Module Membership
 *     description: |
 *       Endpoint ini digunakan untuk mengupload atau mengupdate foto profil user.  
 *       **Memerlukan Bearer Token (JWT)** untuk mengaksesnya.  
 *       
 *       Ketentuan:
 *       - Akses hanya dapat dilakukan dengan Bearer Token yang valid.  
 *       - Parameter `email` tidak dikirim melalui request body, melainkan diambil dari payload JWT hasil login.  
 *       - Format image yang diperbolehkan hanya **JPEG** dan **PNG**.  
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Request Successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 0
 *               message: Update Profile Image berhasil
 *               data:
 *                 email: user@nutech-integrasi.com
 *                 first_name: User Edited
 *                 last_name: Nutech Edited
 *                 profile_image: https://yoururlapi.com/profile-updated.jpeg
 *       400:
 *         description: Bad Request (Format Image tidak sesuai)
 *         content:
 *           application/json:
 *             example:
 *               status: 102
 *               message: Format Image tidak sesuai
 *               data: null
 *       401:
 *         description: Unauthorized (Token tidak valid atau kadaluwarsa)
 *         content:
 *           application/json:
 *             example:
 *               status: 108
 *               message: Token tidak valid atau kadaluwarsa
 *               data: null
 */

router.put('/profile/image', authenticate, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({
        status: 102,
        message: 'Format Image tidak sesuai',
        data: null
      });
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimes.includes(imageFile.mimetype)) {
      return res.status(400).json({
        status: 102,
        message: 'Format Image tidak sesuai',
        data: null
      });
    }

    const maxSize = 5 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return res.status(400).json({
        status: 102,
        message: 'Ukuran Image melebihi batas 2MB',
        data: null
      });
    }

    const updatedUser = await authService.updateProfileImageService(userId, req.body, imageFile);

    return res.status(200).json({
      status: 0,
      message: 'Update Profile Image berhasil',
      data: {
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        profile_image: updatedUser.profile_image || null
      }
    });

  } catch (error) {
    console.error('Update profile image error:', error);

    if (error.message === 'User not found') {
      return res.status(400).json({
        status: 104,
        message: 'User tidak ditemukan',
        data: null
      });
    }

    return res.status(500).json({
      status: 500,
      message: 'Terjadi kesalahan pada server',
      data: null
    });
  }
});

export default router;