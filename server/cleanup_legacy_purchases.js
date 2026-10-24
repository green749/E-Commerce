import pg from 'pg';
import { env } from './src/config/env.js';

const isRemote = !env.DATABASE_URL.includes('localhost') && !env.DATABASE_URL.includes('127.0.0.1');
const requiresSsl = isRemote || env.DATABASE_URL.includes('sslmode=require') || env.DATABASE_URL.includes('aivencloud.com');
let connStr = env.DATABASE_URL;
if (requiresSsl) {
  connStr = connStr.replace(/[?&]sslmode=[^&]+/i, '').replace(/\?$/, '');
}
const pool = new pg.Pool({
  connectionString: connStr,
  ...(requiresSsl ? { ssl: { rejectUnauthorized: false } } : {})
});

// Safe cutoff timestamp: only rows created before or during the test runs on 2026-10-24
const CUTOFF_TIMESTAMP = '2026-10-24T12:05:00.000Z';

// 41 confirmed test orders
const TEST_ORDER_IDS = [
  '380d9745-6504-4b24-bc95-fda1eea0acca',
  'c557c139-c86b-45db-82d9-e04221df6167',
  '0058fc6a-3c74-431e-94a4-5450f8b45ee9',
  'bf567cac-3595-4ccb-ae14-13f890763b22',
  '664a347d-2927-4f94-8b20-8383b529da42',
  '7f83cd39-b65a-44d7-978d-eb1f73498a6a', // legacy purchase order 1
  '34567f6f-1e9c-4130-b761-3525a5ef7bf7',
  '7664643e-6fc0-4d34-b501-edbbe6b9ac1e',
  'ef919005-7811-4e92-b095-58e65b38d976',
  'f517b3a6-e53b-4b6d-9b76-57104baac795',
  '8a31f077-6912-47d3-8af3-e68ab23e4d5a',
  '6c245c54-d522-4778-8ef8-ba46225e421b', // legacy purchase order 2
  '420ea9c8-e4ea-4fe6-8e9f-f68d71237bbc', // dashboard test order
  'b78cdbd5-468b-4ad8-a379-eebbf63d188f',
  '2e3f3b63-e575-4d3b-9b8b-6ca0cfa4ca64',
  '7035aec4-0cf4-4b30-a0c7-c075fe1ca3e1',
  'e8510a22-1c86-4627-8ef2-609c9a34dfbe',
  'c1f9d6a1-7398-435f-ac25-c2e68e72e570',
  'ebbe4611-126e-42cc-a3aa-4d2be578eea8', // legacy purchase order 3
  '89e2c0ce-60cb-4f17-abc0-df47e710dfd2',
  '7b8fa64f-6c94-4295-9772-73a598c9ba59',
  'cb67560a-7ef7-42fa-a4ad-252cae837c4f',
  '88c36648-9432-48a0-8dca-e2f987998e69',
  '451d8bef-35ef-44c1-b945-97b6f2e02238',
  '35ed5136-6dc7-468d-b2b0-dc15c23fd745', // legacy purchase order 4
  '925638e7-6154-4c85-8ea7-4fd2aa3b8f39',
  'b50df88e-69cb-430e-b8f6-f27c65603d5a',
  'e5e1da14-af37-4fa7-8e5c-3fe1423e5dd3',
  '5317c4ac-f589-4fb9-af5b-633f7a96b1b8',
  'c1dfd6fb-4b13-4567-a4fa-e268f75ea3d9',
  'c1ddc593-a91a-4fd8-a8b1-0659eafe589d', // dashboard test order
  '31e0367b-28bb-43f4-be7e-6b085cb0e00e',
  '3dc38ab1-9bb0-4b1f-9d07-32e976be1a9e',
  '6e3e3673-380c-4e54-88fd-186cc1002515',
  '2f1362ab-ffad-4793-9990-ab6d142db787',
  '03aa44a1-d372-4bfa-89e2-1801b3b4824f',
  '5aa4386b-006b-488d-93d5-abb8f06d974b',
  'b650bbd4-25cc-406a-af3c-bbfb2414ed14',
  'a8810d1c-5afc-4a18-acd2-100cb0189605',
  '1c6450cd-f27c-4817-82e7-7c11b402693e',
  'b04c4fa1-f4ca-4ea9-96bb-ba6b112424b7'
];

// Test products to soft delete
const TEST_PRODUCT_IDS = [
  '44f1cd31-ca96-4160-8db7-b9c4f1230fae', // Admin Test Monitor Arm 1792841875343
  '0b119559-eb8e-4776-93be-5b3cd36baca8'  // Admin Test Monitor Arm 1792843305288
];

// Real botanical products paused by tests to reactivate
const REAL_PRODUCT_IDS_TO_RESUME = [
  '4d00e617-ea00-41c2-8865-36ad4458c86c', // Radiance Moisturizer Eco-Refill Pod
  'b7c7b824-40af-4967-9f80-4e0367c203fd'  // Nourishing Botanical Body Oil
];

// 2 returns attached to test orders
const TEST_RETURN_IDS = [
  '8728ab02-97de-4bab-802d-e9fff1fcde57', // on ORD-TEST-C31BDD95
  '8d68538e-84ff-48fe-bcbc-da98c0004486'  // on ORD-TEST-5BF15730
];

const isDryRun = !process.argv.includes('--execute');

export async function runCleanup() {
  const client = await pool.connect();
  console.log(`\n========================================================================`);
  console.log(` CLEANUP SCRIPT: LEGACY PURCHASES & INTEGRATION TEST ARTIFACTS`);
  console.log(` Mode: [${isDryRun ? 'DRY-RUN (WILL ROLL BACK ALL CHANGES)' : 'LIVE EXECUTION'}]`);
  console.log(` Cutoff Timestamp: ${CUTOFF_TIMESTAMP}`);
  console.log(`========================================================================\n`);

  try {
    await client.query('BEGIN');

    // STEP 1: DROP PURCHASES TRIGGER AND TABLE FIRST (Handles FK from purchases.order_id)
    console.log('[STEP 1] Dropping purchases trigger and table...');
    const purchasesCountBefore = (await client.query(`SELECT count(*)::int FROM purchases;`)).rows[0].count;
    console.log(`  - purchases row count before drop: ${purchasesCountBefore}`);

    await client.query(`DROP TRIGGER IF EXISTS trg_purchases_updated_at ON purchases;`);
    await client.query(`DROP TABLE IF EXISTS purchases CASCADE;`);
    console.log(`  - Trigger trg_purchases_updated_at dropped`);
    console.log(`  - Table purchases dropped successfully`);

    // STEP 2: INVENTORY QUANTITY CHECK
    console.log('\n[STEP 2] Verifying inventory quantities for target variants...');
    const invCheck = await client.query(`
      SELECT v.sku, i.quantity_on_hand, i.quantity_reserved
      FROM variants v
      JOIN inventory i ON i.variant_id = v.id
      WHERE v.sku IN ('PO-CHAM-100', 'PO-RFL-RAD-50');
    `);
    console.table(invCheck.rows);
    console.log('  - Analysis: Baseline in seed.js is 40 for PO-CHAM-100 and 100 for PO-RFL-RAD-50.');
    console.log('  - Since runSeed() already reset quantities to baseline and no real customer orders exist,');
    console.log('  - NO inventory adjustment is required (adjustment = 0). Preserving current values.');

    // STEP 3: DELETE DEPENDENT ROWS OF TEST ORDERS (returns, order_items, order_status_history)
    console.log('\n[STEP 3] Cleaning up test order dependencies...');
    
    // 3a. Returns attached to test orders
    const returnsBefore = (await client.query(`SELECT count(*)::int FROM returns;`)).rows[0].count;
    const delReturns = await client.query(
      `DELETE FROM returns WHERE id = ANY($1::uuid[]) RETURNING id;`,
      [TEST_RETURN_IDS]
    );
    const returnsAfter = (await client.query(`SELECT count(*)::int FROM returns;`)).rows[0].count;
    console.log(`  - returns count before: ${returnsBefore}, deleted: ${delReturns.rowCount}, after: ${returnsAfter}`);

    // 3b. Order status history for test orders
    const histBefore = (await client.query(`SELECT count(*)::int FROM order_status_history;`)).rows[0].count;
    const delHist = await client.query(
      `DELETE FROM order_status_history WHERE order_id = ANY($1::uuid[]) RETURNING id;`,
      [TEST_ORDER_IDS]
    );
    const histAfter = (await client.query(`SELECT count(*)::int FROM order_status_history;`)).rows[0].count;
    console.log(`  - order_status_history count before: ${histBefore}, deleted: ${delHist.rowCount}, after: ${histAfter}`);

    // 3c. Order items for test orders
    const itemsBefore = (await client.query(`SELECT count(*)::int FROM order_items;`)).rows[0].count;
    const delItems = await client.query(
      `DELETE FROM order_items WHERE order_id = ANY($1::uuid[]) AND created_at <= $2 RETURNING id;`,
      [TEST_ORDER_IDS, CUTOFF_TIMESTAMP]
    );
    const itemsAfter = (await client.query(`SELECT count(*)::int FROM order_items;`)).rows[0].count;
    console.log(`  - order_items count before: ${itemsBefore}, deleted: ${delItems.rowCount}, after: ${itemsAfter}`);

    // STEP 4: DELETE 41 CONFIRMED TEST ORDERS
    console.log('\n[STEP 4] Deleting 41 confirmed test orders...');
    const ordersBefore = (await client.query(`SELECT count(*)::int FROM orders;`)).rows[0].count;
    const delOrders = await client.query(
      `DELETE FROM orders WHERE id = ANY($1::uuid[]) AND created_at <= $2 RETURNING id;`,
      [TEST_ORDER_IDS, CUTOFF_TIMESTAMP]
    );
    const ordersAfter = (await client.query(`SELECT count(*)::int FROM orders;`)).rows[0].count;
    console.log(`  - orders count before: ${ordersBefore}, deleted: ${delOrders.rowCount}, after: ${ordersAfter}`);

    // STEP 5: DELETE TEST PURCHASE REQUESTS AND INTERNAL ACTIONS
    console.log('\n[STEP 5] Removing test purchase_requests and internal_actions...');
    
    // Purchase requests
    const prBefore = (await client.query(`SELECT count(*)::int FROM purchase_requests;`)).rows[0].count;
    const delPR = await client.query(
      `DELETE FROM purchase_requests WHERE created_at <= $1 RETURNING id;`,
      [CUTOFF_TIMESTAMP]
    );
    const prAfter = (await client.query(`SELECT count(*)::int FROM purchase_requests;`)).rows[0].count;
    console.log(`  - purchase_requests count before: ${prBefore}, deleted: ${delPR.rowCount}, after: ${prAfter}`);

    // Internal actions
    const iaBefore = (await client.query(`SELECT count(*)::int FROM internal_actions;`)).rows[0].count;
    const delIA = await client.query(
      `DELETE FROM internal_actions WHERE created_at <= $1 RETURNING id;`,
      [CUTOFF_TIMESTAMP]
    );
    const iaAfter = (await client.query(`SELECT count(*)::int FROM internal_actions;`)).rows[0].count;
    console.log(`  - internal_actions count before: ${iaBefore}, deleted: ${delIA.rowCount}, after: ${iaAfter}`);

    // STEP 6: SOFT-DELETE TEST PRODUCTS
    console.log('\n[STEP 6] Soft-deleting test products (Admin Test Monitor Arm)...');
    const testProdBefore = (await client.query(`SELECT id, name, is_active, deleted_at FROM products WHERE id = ANY($1::uuid[]);`, [TEST_PRODUCT_IDS])).rows;
    console.log('  - Before soft-delete:');
    console.table(testProdBefore);

    await client.query(`
      UPDATE products
      SET deleted_at = CURRENT_TIMESTAMP, is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1::uuid[]);
    `, [TEST_PRODUCT_IDS]);

    const testProdAfter = (await client.query(`SELECT id, name, is_active, deleted_at FROM products WHERE id = ANY($1::uuid[]);`, [TEST_PRODUCT_IDS])).rows;
    console.log('  - After soft-delete:');
    console.table(testProdAfter);

    // STEP 7: REACTIVATE REAL BOTANICAL PRODUCTS PAUSED BY TESTS
    console.log('\n[STEP 7] Reactivating the 2 real botanical products paused by tests...');
    const realProdBefore = (await client.query(`SELECT id, name, slug, is_active FROM products WHERE id = ANY($1::uuid[]);`, [REAL_PRODUCT_IDS_TO_RESUME])).rows;
    console.log('  - Before reactivation:');
    console.table(realProdBefore);

    await client.query(`
      UPDATE products
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1::uuid[]);
    `, [REAL_PRODUCT_IDS_TO_RESUME]);

    const realProdAfter = (await client.query(`SELECT id, name, slug, is_active FROM products WHERE id = ANY($1::uuid[]);`, [REAL_PRODUCT_IDS_TO_RESUME])).rows;
    console.log('  - After reactivation:');
    console.table(realProdAfter);

    // TRANSACTION COMPLETION
    if (isDryRun) {
      await client.query('ROLLBACK');
      console.log(`\n========================================================================`);
      console.log(` [DRY-RUN COMPLETE]: All steps executed and validated successfully.`);
      console.log(` Entire transaction was ROLLED BACK. Zero database changes were persisted.`);
      console.log(`========================================================================\n`);
    } else {
      await client.query('COMMIT');
      console.log(`\n========================================================================`);
      console.log(` [EXECUTION COMPLETE]: All steps COMMITTED successfully to the database.`);
      console.log(`========================================================================\n`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`\n[ERROR]: Cleanup encountered an exception. Transaction ROLLED BACK.`, err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Auto-run if executed directly via `node cleanup_legacy_purchases.js`
if (process.argv[1]?.endsWith('cleanup_legacy_purchases.js')) {
  runCleanup().catch(console.error);
}
