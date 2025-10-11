import { Client } from 'pg'
import path from 'path';
import fs from 'fs';

main();

async function main () {

  const action = 'up'; // down

  const SCHEMA_TABLE = 'schema_migrations';

  // ... Connect to postgres database ...
  const psql_string = process.env["BROKER_DB_STRING"];
  const db = new Client({connectionString: psql_string});
  await db.connect();

  // ... Get files of migrations ...
  const migrations_dir = path.join(import.meta.dirname, '..', 'migrations');
  const migrations_files = fs.readdirSync(migrations_dir, 'utf8');

  // ... Check table of migrations exist ...
  const schema_table = await db.query('SELECT COUNT(1) FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2', ['public', SCHEMA_TABLE]);
  if (schema_table.rows[0].count == 0) {
    await create_schema_table(db, SCHEMA_TABLE, 'public');
  }

  // ... Run migrations comparing to public schema ...
  for (const migration of migrations_files) {
    const [version] = migration.split('_', 1);
    const response = await db.query(`SELECT id FROM public.${SCHEMA_TABLE} WHERE version = $1`, [version]);
    if (response.rows.length == 0) {
      const migration_class = await import(path.join(migrations_dir, migration));
      await migration_class.default.perform(action, db, SCHEMA_TABLE);
      await db.query(`INSERT INTO public.${SCHEMA_TABLE} (version, name) VALUES ($1, $2)`, [version, migration]);
    }
  }

  await db.end();

}

async function create_schema_table (db, name, schema) {
  return await db.query(`
    CREATE TABLE ${schema}.${name} (
      id  SERIAL        PRIMARY KEY,
      version           TEXT          NOT NULL,
      name              TEXT          NOT NULL
    );
  `)
}
