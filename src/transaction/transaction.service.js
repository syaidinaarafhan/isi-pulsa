import db from '../config/dbHelper.js';

export const getUserBalance = async (userId) => {
    const result = await db.query(
        'SELECT balance FROM "User" WHERE id = $1',
        [userId]
    );
    return result.rows[0]?.balance;
};

export const topUpBalance = async (userId, amount) => {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const invoiceNumber = await generateInvoiceNumber(client);

        const userResult = await client.query(
            'UPDATE "User" SET balance = balance + $1 WHERE id = $2 RETURNING balance',
            [amount, userId]
        );

        await client.query(
            'INSERT INTO "History" (user_id, invoice_number, transaction_type, description, total_amount, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
            [userId, invoiceNumber.toString(), 'TOPUP', 'Top Up Balance', amount]
        );

        await client.query('COMMIT');

        return {
            balance: userResult.rows[0].balance,
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(error.message);
    } finally {
        client.release();
    }
};

export const transactionService = async (userId, serviceCode) => {
    const client = await db.getClient();
    
    try {
        const serviceResult = await client.query(
            'SELECT * FROM "Services" WHERE service_code = $1',
            [serviceCode]
        );

        const service = serviceResult.rows[0];
        console.log('Service found:', service);

        if (!service) {
            throw new Error('Service tidak ditemukan');
        }

        const userResult = await client.query(
            'SELECT balance FROM "User" WHERE id = $1',
            [userId]
        );

        const user = userResult.rows[0];
        if (user.balance < service.service_tariff) {
            throw new Error('Saldo tidak mencukupi');
        }

        await client.query('BEGIN');

        const invoiceNumber = await generateInvoiceNumber(client);

        await client.query(
            'UPDATE "User" SET balance = balance - $1 WHERE id = $2',
            [service.service_tariff, userId]
        );

        const transactionResult = await client.query(
            'INSERT INTO "History" (user_id, invoice_number, transaction_type, description, total_amount, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
            [userId, invoiceNumber.toString(), 'PAYMENT', service.service_name, service.service_tariff]
        );

        await client.query('COMMIT');

        const transaction = transactionResult.rows[0];

        return {
            invoice_number: transaction.invoice_number,
            service_code: serviceCode,
            service_name: service.service_name,
            transaction_type: 'PAYMENT',
            total_amount: service.service_tariff,
            created_on: transaction.createdAt,
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(error.message);
    } finally {
        client.release();
    }
};

export const getTransactionHistory = async (offset, limit, userId) => {
    const result = await db.query(
        'SELECT invoice_number, transaction_type, description, total_amount, "createdAt" FROM "History" WHERE user_id = $1 ORDER BY "createdAt" DESC OFFSET $2 LIMIT $3',
        [userId, offset, limit]
    );
    return result.rows;
};

async function generateInvoiceNumber(client) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const result = await client.query(
        'SELECT invoice_number FROM "History" WHERE "createdAt" >= $1 AND "createdAt" <= $2 ORDER BY invoice_number DESC LIMIT 1',
        [startOfDay, endOfDay]
    );

    let sequence = 1;
    if (result.rows.length > 0) {
        const lastInvoice = result.rows[0].invoice_number;
        const lastSequence = parseInt(lastInvoice.split('-')[1]);
        sequence = lastSequence + 1;
    }

    const sequenceStr = sequence.toString().padStart(3, '0');
    return `INV${dateStr}-${sequenceStr}`;
}