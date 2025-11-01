import express from 'express';
import * as transactionService from './transaction.service.js';
import { authenticate } from '../auth/passport.js';

const router = express.Router();

/**
 * @openapi
 * /getBalance:
 *   get:
 *     tags:
 *       - 3. Module Transaction
 *     description: |
 *       Endpoint ini digunakan untuk mendapatkan informasi **balance / saldo terakhir** dari user yang sedang login.  
 *       **Memerlukan Bearer Token (JWT)** untuk mengaksesnya.
 *       
 *       Ketentuan:
 *       - Service ini harus menggunakan Bearer Token JWT untuk mengaksesnya.  
 *       - Tidak ada parameter `email` di query param atau request body, karena data `email` diambil dari payload JWT hasil login.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Get Balance / Saldo Berhasil
 *         content:
 *           application/json:
 *             example:
 *               status: 0
 *               message: Get Balance Berhasil
 *               data:
 *                 balance: 1000000
 *       401:
 *         description: Unauthorized (Token tidak valid atau kadaluwarsa)
 *         content:
 *           application/json:
 *             example:
 *               status: 108
 *               message: Token tidak valid atau kadaluwarsa
 *               data: null
 */

router.get('/getBalance', authenticate, async (req, res) => {
    try {
        const balance = await transactionService.getUserBalance(req.user.id);
        return res.status(200).json({
            status: 0,
            message: 'Get Balance berhasil',
            data: { balance }
        });
    } catch (error) {
        console.error('Get Balance error:', error);

        return res.status(500).json({
            status: 500,
            message: 'Terjadi kesalahan pada server',
            data: null
        });
    }
})

/**
 * @openapi
 * /topup:
 *   post:
 *     tags:
 *       - 3. Module Transaction
 *     description: |
 *       Endpoint ini digunakan untuk melakukan **Top Up balance / saldo** dari user.  
 *       **Memerlukan Bearer Token (JWT)** untuk mengaksesnya.
 *       
 *       Ketentuan:
 *       - Service ini harus menggunakan Bearer Token JWT untuk mengaksesnya.  
 *       - Tidak ada parameter `email` di query param atau request body, karena data `email` diambil dari payload JWT hasil login.  
 *       - Setiap kali melakukan Top Up, balance / saldo user akan otomatis bertambah.  
 *       - Parameter `amount` hanya boleh berupa angka dan **tidak boleh lebih kecil dari 0**.  
 *       - Pada saat Top Up, `transaction_type` di database harus di-set menjadi **TOPUP**.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - top_up_amount
 *             properties:
 *               top_up_amount:
 *                 type: number
 *                 example: 1000000
 *     responses:
 *       200:
 *         description: Request Successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 0
 *               message: Top Up Balance berhasil
 *               data:
 *                 balance: 2000000
 *       400:
 *         description: Bad Request (parameter amount tidak valid)
 *         content:
 *           application/json:
 *             example:
 *               status: 102
 *               message: Paramter amount hanya boleh angka dan tidak boleh lebih kecil dari 0
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

router.post('/topup', authenticate, async (req, res) => {
  try {
    const { top_up_amount } = req.body;
    const userId = req.user.id;

    if (top_up_amount === undefined || top_up_amount === null) {
      return res.status(400).json({
        status: 102,
        message: 'Parameter amount wajib diisi',
        data: null
      });
    }

    const amount = Number(top_up_amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        status: 102,
        message: 'Parameter amount hanya boleh angka dan tidak boleh lebih kecil dari 0',
        data: null
      });
    }

    const newBalance = await transactionService.topUpBalance(userId, amount);

    return res.status(200).json({
      status: 0,
      message: 'Top Up Balance berhasil',
      data: { balance: newBalance }
    });

  } catch (error) {
    console.error('Top-up error:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        status: 107,
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

/**
 * @openapi
 * /transaction:
 *   post:
 *     tags:
 *       - 3. Module Transaction
 *     description: |
 *       Endpoint ini digunakan untuk melakukan transaksi dari service / layanan yang tersedia.  
 *       **Memerlukan Bearer Token (JWT)** untuk mengaksesnya.
 *       
 *       Ketentuan:
 *       - Service ini harus menggunakan Bearer Token JWT untuk mengaksesnya.  
 *       - Tidak ada parameter `email` di query param atau request body, karena data `email` diambil dari payload JWT hasil login.  
 *       - Setiap kali melakukan transaksi harus dipastikan balance / saldo mencukupi.  
 *       - Pada saat transaksi, `transaction_type` di database harus di-set menjadi **PAYMENT**.  
 *       - Response `invoice_number` menggunakan format yang dapat digenerate secara bebas.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - service_code
 *             properties:
 *               service_code:
 *                 type: string
 *                 example: PULSA
 *     responses:
 *       200:
 *         description: Transaksi Berhasil
 *         content:
 *           application/json:
 *             example:
 *               status: 0
 *               message: Transaksi berhasil
 *               data:
 *                 invoice_number: INV17082023-001
 *                 service_code: PLN_PRABAYAR
 *                 service_name: PLN Prabayar
 *                 transaction_type: PAYMENT
 *                 total_amount: 10000
 *                 created_on: 2023-08-17T10:10:10.000Z
 *       400:
 *         description: Bad Request (service tidak ditemukan)
 *         content:
 *           application/json:
 *             example:
 *               status: 102
 *               message: Service atau Layanan tidak ditemukan
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

router.post('/transaction', authenticate, async (req, res) => {
  try {
    const { service_code } = req.body;
    const userId = req.user.id;

    if (!service_code) {
      return res.status(400).json({
        status: 101,
        message: 'Parameter service_code wajib diisi',
        data: null
      });
    }

    const transactionResult = await transactionService.transactionService(userId, service_code);

    return res.status(200).json({
      status: 0,
      message: 'Transaksi berhasil',
      data: {
        invoice_number: transactionResult.invoice_number,
        service_code: transactionResult.service_code,
        service_name: transactionResult.service_name,
        transaction_type: transactionResult.transaction_type,
        total_amount: transactionResult.total_amount,
        created_on: transactionResult.createdAt
      }
    });

  } catch (error) {
    console.error('Transaction error:', error);

    if (error.message === 'Service tidak ditemukan') {
      return res.status(400).json({
        status: 102,
        message: 'Service atau Layanan tidak ditemukan',
        data: null
      });
    }

    if (error.message === 'Saldo tidak mencukupi') {
      return res.status(400).json({
        status: 103,
        message: 'Saldo tidak mencukupi untuk melakukan transaksi',
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
 * /transaction/history:
 *   get:
 *     tags:
 *       - 3. Module Transaction
 *     description: |
 *       Endpoint ini digunakan untuk mendapatkan informasi **history transaksi** dari user yang sedang login.  
 *       **Memerlukan Bearer Token (JWT)** untuk mengaksesnya.
 *       
 *       Ketentuan:
 *       - Service ini harus menggunakan Bearer Token JWT untuk mengaksesnya.  
 *       - Tidak ada parameter `email` di query param atau request body, karena data `email` diambil dari payload JWT hasil login.  
 *       - Parameter `limit` bersifat opsional, jika tidak dikirim maka akan menampilkan semua data.  
 *       - Data diurutkan dari yang paling baru berdasarkan `created_on`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           example: 0
 *         description: Offset data (opsional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 3
 *         description: Jumlah data yang ingin ditampilkan (opsional)
 *     responses:
 *       200:
 *         description: Get History Transaksi Berhasil
 *         content:
 *           application/json:
 *             example:
 *               status: 0
 *               message: Get History Berhasil
 *               data:
 *                 offset: 0
 *                 limit: 3
 *                 records:
 *                   - invoice_number: INV17082023-001
 *                     transaction_type: TOPUP
 *                     description: Top Up balance
 *                     total_amount: 100000
 *                     created_on: 2023-08-17T10:10:10.000Z
 *                   - invoice_number: INV17082023-002
 *                     transaction_type: PAYMENT
 *                     description: PLN Pascabayar
 *                     total_amount: 10000
 *                     created_on: 2023-08-17T11:10:10.000Z
 *                   - invoice_number: INV17082023-003
 *                     transaction_type: PAYMENT
 *                     description: Pulsa Indosat
 *                     total_amount: 40000
 *                     created_on: 2023-08-17T12:10:10.000Z
 *       401:
 *         description: Unauthorized (Token tidak valid atau kadaluwarsa)
 *         content:
 *           application/json:
 *             example:
 *               status: 108
 *               message: Token tidak valid atau kadaluwarsa
 *               data: null
 */

router.get('/transaction/history', authenticate, async (req, res) => {
  try {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || null;
    const userId = req.user.id;

    const history = await transactionService.getTransactionHistory(offset, limit, userId);

    if (!history || history.length === 0) {
      return res.status(404).json({
        status: 105,
        message: 'Data transaksi tidak ditemukan',
        data: []
      });
    }

    const formatted = history.map(item => ({
        invoice_number: item.invoice_number,
        transaction_type: item.transaction_type,
        description: item.description,
        total_amount: item.total_amount,
        created_on: item.createdAt
    }));

    return res.status(200).json({
      status: 0,
      message: 'Get History berhasil',
      data: formatted
    });

  } catch (error) {
    console.error('Get transaction history error:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        status: 107,
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