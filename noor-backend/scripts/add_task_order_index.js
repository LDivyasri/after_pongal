const db = require('../config/db');

async function addTaskOrderIndex() {
    try {
        console.log('Checking tasks table for order_index column...');

        // Check if column exists
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'tasks' 
            AND COLUMN_NAME = 'order_index'
        `);

        if (columns.length === 0) {
            console.log('Adding order_index column...');
            await db.query(`
                ALTER TABLE tasks 
                ADD COLUMN order_index INT DEFAULT 0
            `);
            console.log('Column added.');

            // Initialize order_index based on created_at or just distinct ids
            console.log('Initializing order_index for existing tasks...');
            const [tasks] = await db.query('SELECT id, phase_id FROM tasks ORDER BY phase_id, created_at ASC');

            // Group by phase to order sequentially within phase
            const phaseGroups = {};
            tasks.forEach(t => {
                if (!phaseGroups[t.phase_id]) phaseGroups[t.phase_id] = [];
                phaseGroups[t.phase_id].push(t);
            });

            for (const phaseId in phaseGroups) {
                const phaseTasks = phaseGroups[phaseId];
                for (let i = 0; i < phaseTasks.length; i++) {
                    await db.query('UPDATE tasks SET order_index = ? WHERE id = ?', [i, phaseTasks[i].id]);
                }
            }
            console.log('Existing tasks re-indexed.');

        } else {
            console.log('order_index column already exists.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error adding column:', error);
        process.exit(1);
    }
}

addTaskOrderIndex();
