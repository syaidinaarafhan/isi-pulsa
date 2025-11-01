import db from '../config/dbHelper.js';

export const getAllBanner = async () => {
    const result = await db.query(
        'SELECT "banner_name", "banner_image", description FROM "Banner" ORDER BY "createdAt" ASC'
    );
    return result.rows;
};

export const getAllService = async () => {
    const result = await db.query(
        'SELECT "service_code", "service_name", "service_icon", "service_tariff" FROM "Services" ORDER BY "createdAt" DESC'
    );
    return result.rows;
}