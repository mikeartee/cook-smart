/**
 * Archive Old Stripe Products Script
 * Archives the old subscription products to prevent new subscriptions
 */

require('dotenv').config();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Your old product IDs from the screenshot
const OLD_PRODUCTS_TO_ARCHIVE = [
  'Cook Smart Yearly Full Price',
  'Cook Smart Yearly Referral',
  'Cook Smart Pre-Purchase in BETA Yearly',
  'Cook Smart Monthly',
  'Cook Smart Weekly',
];

async function archiveOldProducts() {
  console.log('🗄️  Starting to archive old Stripe products...\n');

  try {
    // Get all products
    console.log('📋 Fetching all products from Stripe...');
    const products = await stripe.products.list({limit: 100});

    console.log(`✅ Found ${products.data.length} total products\n`);

    let archivedCount = 0;

    // Archive each old product
    for (const product of products.data) {
      // Check if this is one of the old products
      if (OLD_PRODUCTS_TO_ARCHIVE.includes(product.name)) {
        console.log(`📦 Archiving: ${product.name} (${product.id})`);

        try {
          await stripe.products.update(product.id, {
            active: false,
          });
          console.log(`   ✅ Archived successfully\n`);
          archivedCount++;
        } catch (error) {
          console.log(`   ❌ Failed to archive: ${error.message}\n`);
        }
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✨ Archive complete! ${archivedCount} products archived\n`);

    // List remaining active products
    console.log('📋 Remaining active products:');
    const activeProducts = await stripe.products.list({
      active: true,
      limit: 100,
    });

    activeProducts.data.forEach(product => {
      console.log(`   - ${product.name} (${product.id})`);
    });

    console.log(
      "\n✅ Old products are now archived and won't accept new subscriptions!",
    );
    console.log(
      '💡 Existing subscriptions on old products will continue to work.\n',
    );
  } catch (error) {
    console.error('❌ Error archiving products:', error.message);
    throw error;
  }
}

// Run the archive
if (require.main === module) {
  archiveOldProducts()
    .then(() => {
      console.log('✅ Archive process completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Archive failed:', error);
      process.exit(1);
    });
}

module.exports = {archiveOldProducts};
