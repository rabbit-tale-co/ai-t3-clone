const { config } = require('dotenv');
const postgres = require('postgres');

config({
  path: '.env.local',
});

const fixTokenTable = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const sql = postgres(process.env.POSTGRES_URL);

  console.log('⏳ Fixing TokenRequestMonitor table...');

  try {
    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'TokenRequestMonitor'
      );
    `;

    console.log('TokenRequestMonitor table exists:', tableExists[0].exists);

    if (!tableExists[0].exists) {
      console.log('Creating TokenRequestMonitor table...');

      // Create table if it doesn't exist
      await sql`
        CREATE TABLE "TokenRequestMonitor" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "userId" uuid NOT NULL,
          "date" varchar(10) NOT NULL,
          "requestCount" varchar DEFAULT '0' NOT NULL,
          "firstRequestAt" timestamp DEFAULT now() NOT NULL,
          "lastRequestAt" timestamp DEFAULT now() NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          "updatedAt" timestamp DEFAULT now() NOT NULL
        );
      `;

      // Add foreign key
      await sql`
        ALTER TABLE "TokenRequestMonitor"
        ADD CONSTRAINT "TokenRequestMonitor_userId_User_id_fk"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
      `;
    }

    // Add indexes if they don't exist
    console.log('Adding indexes...');

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "TokenRequestMonitor_userId_date_key"
      ON "TokenRequestMonitor"("userId", "date");
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS "TokenRequestMonitor_userId_idx"
      ON "TokenRequestMonitor"("userId");
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS "TokenRequestMonitor_date_idx"
      ON "TokenRequestMonitor"("date");
    `;

    // Test the functions
    console.log('Testing table access...');
    const count = await sql`SELECT COUNT(*) as count FROM "TokenRequestMonitor";`;
    console.log(`Records in table: ${count[0].count}`);

    console.log('✅ TokenRequestMonitor table is ready!');

  } catch (error) {
    console.error('❌ Failed to fix table:', error);
  } finally {
    await sql.end();
  }
};

fixTokenTable().catch((err) => {
  console.error('❌ Script failed');
  console.error(err);
  process.exit(1);
});
