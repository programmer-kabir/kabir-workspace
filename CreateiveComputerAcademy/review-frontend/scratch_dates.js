import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'u647959341_cca_admin',
    password: 'Cc@dbAmin12',
    database: 'u647959341_cca_manage_db'
  });

  const [tasks] = await connection.query(
    `SELECT id, title, status, updated_at FROM tasks WHERE status = 'In Review' LIMIT 5`
  );

  console.log('DATABASE TASKS (In Review):');
  for (const t of tasks) {
    console.log(`ID: ${t.id} | Title: ${t.title} | Raw updated_at: ${t.updated_at} | Type: ${typeof t.updated_at}`);
  }

  const [sysTime] = await connection.query(`SELECT NOW() AS now, @@global.time_zone, @@session.time_zone`);
  console.log('\nMYSQL SYSTEM TIME:', sysTime[0]);

  console.log('\nNODE CURRENT TIME (Local):', new Date().toString());
  console.log('NODE CURRENT TIME (ISO):', new Date().toISOString());

  await connection.end();
}

main().catch(console.error);