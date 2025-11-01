import express from 'express';
import { authenticate } from '../auth/passport.js';
import * as informationService from './info.service.js';
import e from 'express';

const router = express.Router();

/**
 * @openapi
 * /banner:
 *   get:
 *     tags:
 *       - 2. Module Information
 *     summary: Mendapatkan list banner
 *     description: |
 *       Endpoint ini digunakan untuk mendapatkan daftar banner yang tersedia.  
 *       **Tidak memerlukan Token untuk mengaksesnya.**
 *       
 *       Ketentuan:
 *       - Data banner harus diambil dari database, **tidak boleh hardcode**.  
 *       - Tidak perlu membuat module CRUD banner.  
 *       - Handling response harus sesuai dengan dokumentasi.
 *     responses:
 *       200:
 *         description: Request Successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 0
 *               message: Sukses
 *               data:
 *                 - banner_name: Banner 1
 *                   banner_image: https://nutech-integrasi.app/dummy.jpg
 *                   description: Lerem Ipsum Dolor sit amet
 *                 - banner_name: Banner 2
 *                   banner_image: https://nutech-integrasi.app/dummy.jpg
 *                   description: Lerem Ipsum Dolor sit amet
 *                 - banner_name: Banner 3
 *                   banner_image: https://nutech-integrasi.app/dummy.jpg
 *                   description: Lerem Ipsum Dolor sit amet
 *                 - banner_name: Banner 4
 *                   banner_image: https://nutech-integrasi.app/dummy.jpg
 *                   description: Lerem Ipsum Dolor sit amet
 *                 - banner_name: Banner 5
 *                   banner_image: https://nutech-integrasi.app/dummy.jpg
 *                   description: Lerem Ipsum Dolor sit amet
 *                 - banner_name: Banner 6
 *                   banner_image: https://nutech-integrasi.app/dummy.jpg
 *                   description: Lerem Ipsum Dolor sit amet
 */

router.get('/banner', async (req, res) => {
  try {
    const banners = await informationService.getAllBanner();

    if (!banners || banners.length === 0) {
      return res.status(404).json({
        status: 105,
        message: 'Data banner tidak ditemukan',
        data: null
      });
    }

    return res.status(200).json({
      status: 0,
      message: 'Sukses',
      data: banners
    });
  } catch (error) {
    console.error('Get banner error:', error);

    return res.status(500).json({
      status: 500,
      message: 'Terjadi kesalahan pada server',
      data: null
    });
  }
});

/**
 * @openapi
 * /service:
 *   get:
 *     tags:
 *       - 2. Module Information
 *     summary: Mendapatkan list Service atau Layanan PPOB
 *     description: |
 *       Endpoint ini digunakan untuk mendapatkan daftar layanan (Service) PPOB.  
 *       **Memerlukan Bearer Token (JWT)** untuk mengaksesnya.
 *       
 *       Ketentuan:
 *       - Data Service/Layanan harus diambil dari database, **tidak boleh hardcode**.  
 *       - Tidak perlu membuat module CRUD Service/Layanan.  
 *       - Handling response harus sesuai dengan dokumentasi.
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
 *                 - service_code: PAJAK
 *                   service_name: Pajak PBB
 *                   service_icon: https://nutech-integrasi.app/dummy.jpg
 *                   service_tariff: 40000
 *                 - service_code: PLN
 *                   service_name: Listrik
 *                   service_icon: https://nutech-integrasi.app/dummy.jpg
 *                   service_tariff: 10000
 *                 - service_code: PDAM
 *                   service_name: PDAM Berlangganan
 *                   service_icon: https://nutech-integrasi.app/dummy.jpg
 *                   service_tariff: 40000
 *                 - service_code: PULSA
 *                   service_name: Pulsa
 *                   service_icon: https://nutech-integrasi.app/dummy.jpg
 *                   service_tariff: 40000
 *                 - service_code: PGN
 *                   service_name: PGN Berlangganan
 *                   service_icon: https://nutech-integrasi.app/dummy.jpg
 *                   service_tariff: 50000
 *                 - service_code: MUSIK
 *                   service_name: Musik Berlangganan
 *                   service_icon: https://nutech-integrasi.app/dummy.jpg
 *                   service_tariff: 50000
 *                 - service_code: TV
 *                   service_name: TV Berlangganan
 *                   service_icon: https://nutech-integrasi.app/dummy.jpg
 *                   service_tariff: 50000
 *                 - service_code: PAKET_DATA
 *                   service_name: Paket Data
 *                   service_icon: https://nutech-integrasi.app/dummy.jpg
 *                   service_tariff: 50000
 *                 - service_code: VOUCHER_GAME
 *                   service_name: Voucher Game
 *                   service_icon: https://nutech-integrasi.app/dummy.jpg
 *                   service_tariff: 100000
 *                 - service_code: VOUCHER_MAKANAN
 *                   service_name: Voucher Makanan
 *                   service_icon: https://nutech-integrasi.app/dummy.jpg
 *                   service_tariff: 100000
 *                 - service_code: QURBAN
 *                   service_name: Qurban
 *                   service_icon: https://nutech-integrasi.app/dummy.jpg
 *                   service_tariff: 200000
 *                 - service_code: ZAKAT
 *                   service_name: Zakat
 *                   service_icon: https://nutech-integrasi.app/dummy.jpg
 *                   service_tariff: 300000
 *       401:
 *         description: Unauthorized (Token tidak valid atau kadaluwarsa)
 *         content:
 *           application/json:
 *             example:
 *               status: 108
 *               message: Token tidak valid atau kadaluwarsa
 *               data: null
 */

router.get('/service', authenticate, async (req, res) => {
    try {
        const services = await informationService.getAllService();

        if (!services || services.length === 0) {
            return res.status(404).json({
                status: 105,
                message: 'Data service tidak ditemukan',
                data: null
            });
        }

        return res.status(200).json({
            status: 0,
            message: 'Sukses',
            data: services
        });
    } catch (error) {

        console.error('Get service error:', error);

        return res.status(500).json({
            status: 500,
            message: 'Terjadi kesalahan pada server',
            data: null
        });
    }
});

export default router;