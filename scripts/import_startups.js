/**
 * Import startups from Excel file into Supabase reference_startups table.
 *
 * Prerequisites:
 *   1. Run the SQL migration to add `is_standout` column (see SQL below).
 *   2. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *   3. xlsx package is installed (already in devDependencies).
 *
 * Usage:
 *   node scripts/import_startups.js
 *
 * SQL to run first (via Supabase Dashboard SQL Editor):
 * -------------------------------------------------------
 *   -- Step 1: Add the is_standout column
 *   ALTER TABLE reference_startups
 *     ADD COLUMN IF NOT EXISTS is_standout boolean DEFAULT false;
 *
 *   -- Step 2: Mark all existing rows (the 151 Aly's picks) as standouts
 *   UPDATE reference_startups SET is_standout = true WHERE is_standout = false;
 *
 *   -- Step 3: Delete any non-standout rows (safe for re-runs)
 *   DELETE FROM reference_startups WHERE is_standout = false;
 * -------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// ---------------------------------------------------------------------------
// Load environment variables from .env.local
// ---------------------------------------------------------------------------
const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1).trim();
  env[key] = value;
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const EXCEL_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'Startup_Brainstorm_Sprint_v2.xlsx'
);
const SHEET_NAME = 'Startup Universe';
const BATCH_SIZE = 100;

// ---------------------------------------------------------------------------
// Column mapping: Excel header -> Supabase column
// ---------------------------------------------------------------------------
const COLUMN_MAP = {
  'Company': 'company',
  'Industry': 'industry',
  'One-Line Description': 'one_liner',
  'Funding Stage': 'stage',
  'Amount Raised': 'amount_raised',
  'Key Investors': 'key_investors',
  'ARR / Revenue': 'arr_revenue',
  'Key Traction Metric': 'key_traction',
  'Latest News': 'latest_news',
  'Score': 'score',
  'Interest': 'interest',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanValue(val) {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (str === '' || str === '-' || str === 'N/A' || str === 'n/a') return null;
  return str;
}

function parseScore(val) {
  if (val === undefined || val === null) return null;
  const num = Number(val);
  if (isNaN(num)) return null;
  return Math.round(num);
}

function mapRow(row) {
  const mapped = { is_standout: false };

  for (const [excelCol, dbCol] of Object.entries(COLUMN_MAP)) {
    const raw = row[excelCol];
    if (dbCol === 'score') {
      mapped[dbCol] = parseScore(raw);
    } else {
      mapped[dbCol] = cleanValue(raw);
    }
  }

  return mapped;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Startup Import Script ===\n');

  // 1. Read the Excel file
  console.log(`Reading Excel file: ${EXCEL_PATH}`);
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Excel file not found at: ${EXCEL_PATH}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(EXCEL_PATH);
  const worksheet = workbook.Sheets[SHEET_NAME];
  if (!worksheet) {
    console.error(`Sheet "${SHEET_NAME}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
    process.exit(1);
  }

  const allRows = XLSX.utils.sheet_to_json(worksheet);
  console.log(`Found ${allRows.length} rows in "${SHEET_NAME}" sheet.\n`);

  // 2. Fetch existing standout company names from Supabase
  console.log('Fetching existing standout companies from Supabase...');
  const { data: existingRows, error: fetchError } = await supabase
    .from('reference_startups')
    .select('company')
    .eq('is_standout', true);

  if (fetchError) {
    console.error('Error fetching existing companies:', fetchError.message);
    process.exit(1);
  }

  const existingNames = new Set(
    (existingRows || []).map((r) => r.company?.toLowerCase().trim()).filter(Boolean)
  );
  console.log(`Found ${existingNames.size} existing standout companies.\n`);

  // 3. Filter and map rows
  const toInsert = [];
  let skippedCount = 0;
  let noCompanyCount = 0;

  for (const row of allRows) {
    const companyName = cleanValue(row['Company']);
    if (!companyName) {
      noCompanyCount++;
      continue;
    }

    if (existingNames.has(companyName.toLowerCase().trim())) {
      skippedCount++;
      continue;
    }

    toInsert.push(mapRow(row));
  }

  console.log(`Rows to insert:  ${toInsert.length}`);
  console.log(`Skipped (already standout): ${skippedCount}`);
  console.log(`Skipped (no company name):  ${noCompanyCount}`);
  console.log('');

  if (toInsert.length === 0) {
    console.log('Nothing to insert. Done!');
    return;
  }

  // 4. Batch insert
  const totalBatches = Math.ceil(toInsert.length / BATCH_SIZE);
  let insertedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = toInsert.slice(i, i + BATCH_SIZE);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} rows)... `);

    const { data, error } = await supabase
      .from('reference_startups')
      .insert(batch)
      .select('id');

    if (error) {
      console.log(`ERROR: ${error.message}`);
      errorCount += batch.length;
    } else {
      const count = data ? data.length : batch.length;
      insertedCount += count;
      console.log(`OK (${count} inserted)`);
    }
  }

  // 5. Summary
  console.log('\n=== Import Summary ===');
  console.log(`Total rows in Excel:      ${allRows.length}`);
  console.log(`Existing standouts:       ${existingNames.size}`);
  console.log(`Skipped (duplicate):      ${skippedCount}`);
  console.log(`Skipped (no company):     ${noCompanyCount}`);
  console.log(`Successfully inserted:    ${insertedCount}`);
  if (errorCount > 0) {
    console.log(`Failed to insert:         ${errorCount}`);
  }
  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
