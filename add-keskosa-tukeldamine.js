const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addKeskosaTukeldamine() {
  try {
    console.log('Adding Keskosa tükeldamine product...\n');

    // Use the existing price list ID
    const priceListId = 'cmh1tml8s0000rk70m12w2dm2';
    console.log(`Using price list ID: ${priceListId}`);

    // Generate a new SKU (using a simple increment approach)
    const lastProduct = await prisma.product.findFirst({
      where: {
        sku: {
          startsWith: 'PORK-'
        }
      },
      orderBy: {
        sku: 'desc'
      }
    });

    let newSku = 'PORK-001';
    if (lastProduct) {
      const lastNumber = parseInt(lastProduct.sku.split('-')[1]);
      newSku = `PORK-${String(lastNumber + 1).padStart(3, '0')}`;
    }

    console.log(`Generated SKU: ${newSku}`);

    // Create the product
    const product = await prisma.product.create({
      data: {
        sku: newSku,
        name: 'Keskosa tükeldamine',
        category: 'Värske sealiha',
        uom: 'TK',
        active: true,
        catchWeight: false
      }
    });

    console.log(`✅ Created product: ${product.name} (${product.sku})`);

    // Create the price item
    const priceItem = await prisma.priceItem.create({
      data: {
        productSku: newSku,
        priceListId: priceListId,
        unitPrice: '2'
      }
    });

    console.log(`✅ Created price item: ${priceItem.unitPrice}€`);

    // Verify the creation
    const createdProduct = await prisma.product.findUnique({
      where: {
        sku: newSku
      },
      include: {
        priceItems: {
          include: {
            priceList: true
          }
        }
      }
    });

    console.log('\n📋 Created product details:');
    console.log(`- Name: ${createdProduct.name}`);
    console.log(`- SKU: ${createdProduct.sku}`);
    console.log(`- Category: ${createdProduct.category}`);
    console.log(`- UOM: ${createdProduct.uom}`);
    console.log(`- Price: ${createdProduct.priceItems[0]?.unitPrice}€`);

  } catch (error) {
    console.error('❌ Error creating product:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addKeskosaTukeldamine();
