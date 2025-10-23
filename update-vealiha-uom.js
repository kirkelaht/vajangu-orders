const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateVealihaUOM() {
  try {
    console.log('Updating Värske sealiha products UOM from KG to TK...\n');

    const productSkus = ['PORK-002', 'PORK-003', 'PORK-004', 'PORK-005', 'PORK-006', 'PORK-014'];

    // Update all the specified products
    const result = await prisma.product.updateMany({
      where: {
        sku: { in: productSkus }
      },
      data: {
        uom: 'TK'
      }
    });

    console.log(`✅ Updated ${result.count} products from KG to TK`);

    // Verify the update
    const updatedProducts = await prisma.product.findMany({
      where: {
        sku: { in: productSkus }
      },
      select: {
        name: true,
        sku: true,
        category: true,
        uom: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('\n📋 Updated products:');
    updatedProducts.forEach(product => {
      console.log(`- ${product.name} (${product.sku}) - ${product.uom}`);
    });

  } catch (error) {
    console.error('❌ Error updating products UOM:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateVealihaUOM();
