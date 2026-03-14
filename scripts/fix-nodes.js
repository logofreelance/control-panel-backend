import mysql from 'mysql2/promise';

async function fixNodes() {
    const dbUrl = 'mysql://2aKA11TTHcSG7kF.root:YneVAAeS1k5eSoKO@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test';
    const conn = await mysql.createConnection(dbUrl);

    // Clear old localhost nodes
    console.log('Deleting localhost nodes...');
    await conn.execute('DELETE FROM node_health_metrics');

    // Insert Cloudflare Worker
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const query = `
        INSERT INTO node_health_metrics 
        (node_id, endpoint_url, cpu_usage, memory_usage, uptime, status, last_heartbeat) 
        VALUES (?, ?, ?, ?, ?, 'online', ?)
    `;
    console.log('Inserting Cloudflare node...');
    await conn.execute(query, ['cf-worker-01', 'https://backend-system.logofreelance.workers.dev', '15.0%', '42.0%', 99999, now]);

    console.log('Done!');
    await conn.end();
}

fixNodes().catch(console.error);
