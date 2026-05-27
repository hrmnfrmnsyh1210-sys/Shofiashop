import 'dotenv/config';
import mysql from 'mysql2/promise';

const TARGET_DB = process.argv[2] ?? 'sofia_shop';

// Parse DATABASE_URL but connect WITHOUT specifying a database, so we can CREATE it.
const url = new URL(process.env.DATABASE_URL ?? '');
const config: mysql.ConnectionOptions = {
  host: url.hostname,
  port: Number(url.port || 4000),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  ssl: { rejectUnauthorized: true },
};

async function main() {
  const conn = await mysql.createConnection(config);
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${TARGET_DB}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`,
    );
    console.log(`✓ Database "${TARGET_DB}" ready`);
    const [rows] = await conn.query('SHOW DATABASES');
    console.log('Databases on cluster:');
    for (const r of rows as Array<Record<string, string>>) {
      console.log('  -', Object.values(r)[0]);
    }
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
