const db = require('../config/db');

async function addPhaseSerialColumn() {
    try {
        console.log('Checking phases table columns...');
        const [columns] = await db.query('SHOW COLUMNS FROM phases');

        const hasSerial = columns.some(col => col.Field === 'serial_number');

        if (!hasSerial) {
            console.log('Adding serial_number column...');
            await db.query('ALTER TABLE phases ADD COLUMN serial_number INT DEFAULT 0');
            // Initialize serial_number with order_num if exists, essentially preserving current order as default
            await db.query('UPDATE phases SET serial_number = order_num');
        } else {
            console.log('serial_number column already exists.');
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

addPhaseSerialColumn();
