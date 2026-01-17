const db = require('../config/db');

async function addPhaseFloorColumns() {
    try {
        console.log('Checking phases table columns...');
        const [columns] = await db.query('SHOW COLUMNS FROM phases');

        const hasFloorNumber = columns.some(col => col.Field === 'floor_number');
        const hasFloorName = columns.some(col => col.Field === 'floor_name');

        if (!hasFloorNumber) {
            console.log('Adding floor_number column...');
            await db.query('ALTER TABLE phases ADD COLUMN floor_number INT DEFAULT 0');
        } else {
            console.log('floor_number column already exists.');
        }

        if (!hasFloorName) {
            console.log('Adding floor_name column...');
            await db.query('ALTER TABLE phases ADD COLUMN floor_name VARCHAR(255) DEFAULT "Ground Floor"');
        } else {
            console.log('floor_name column already exists.');
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

addPhaseFloorColumns();
