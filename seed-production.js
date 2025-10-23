const { PrismaClient } = require('@prisma/client');

// Use production database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function seedProduction() {
  console.log('🌱 Starting production database seed...');

  try {
    // Check if data already exists
    const existingRings = await prisma.ring.count();
    const existingProducts = await prisma.product.count();
    
    if (existingRings > 0 || existingProducts > 0) {
      console.log('⚠️  Database already has data. Skipping seed to avoid duplicates.');
      console.log(`   Found ${existingRings} rings and ${existingProducts} products.`);
      return;
    }

    // Create rings
    console.log('📅 Creating rings...');
    const rings = await Promise.all([
      prisma.ring.create({
        data: {
          region: 'Järva-Jaani-Kõmsi ring',
          ringDate: new Date('2025-11-02'),
          visibleFrom: new Date('2025-10-15'),
          visibleTo: new Date('2025-11-01'),
          cutoffAt: new Date('2025-10-30T18:00:00Z'),
          status: 'OPEN'
        }
      }),
      prisma.ring.create({
        data: {
          region: 'Kose-Haapsalu ring',
          ringDate: new Date('2025-11-09'),
          visibleFrom: new Date('2025-10-15'),
          visibleTo: new Date('2025-11-08'),
          cutoffAt: new Date('2025-11-07T18:00:00Z'),
          status: 'OPEN'
        }
      }),
      prisma.ring.create({
        data: {
          region: 'Rakke-Viljandi ring',
          ringDate: new Date('2025-11-16'),
          visibleFrom: new Date('2025-10-15'),
          visibleTo: new Date('2025-11-15'),
          cutoffAt: new Date('2025-11-14T18:00:00Z'),
          status: 'OPEN'
        }
      }),
      prisma.ring.create({
        data: {
          region: 'Aravete-Maardu ring',
          ringDate: new Date('2025-11-23'),
          visibleFrom: new Date('2025-10-15'),
          visibleTo: new Date('2025-11-22'),
          cutoffAt: new Date('2025-11-21T18:00:00Z'),
          status: 'OPEN'
        }
      }),
      prisma.ring.create({
        data: {
          region: 'Koeru-Vändra ring',
          ringDate: new Date('2025-11-30'),
          visibleFrom: new Date('2025-10-15'),
          visibleTo: new Date('2025-11-29'),
          cutoffAt: new Date('2025-11-28T18:00:00Z'),
          status: 'OPEN'
        }
      }),
      prisma.ring.create({
        data: {
          region: 'Viru-Nigula-Sonda ring',
          ringDate: new Date('2025-12-07'),
          visibleFrom: new Date('2025-10-15'),
          visibleTo: new Date('2025-12-06'),
          cutoffAt: new Date('2025-12-05T18:00:00Z'),
          status: 'OPEN'
        }
      })
    ]);

    console.log(`✅ Created ${rings.length} rings`);

    // Create stops for each ring
    console.log('📍 Creating stops...');
    const stops = [];
    
    for (const ring of rings) {
      if (ring.region === 'Järva-Jaani-Kõmsi ring') {
        const ringStops = await Promise.all([
          prisma.stop.create({
            data: {
              name: 'Järva-Jaani',
              meetingPoint: 'Järva-Jaani keskus, parkla',
              ringId: ring.id,
              sortOrder: 1
            }
          }),
          prisma.stop.create({
            data: {
              name: 'Kõmsi',
              meetingPoint: 'Kõmsi küla, bussipeatus',
              ringId: ring.id,
              sortOrder: 2
            }
          })
        ]);
        stops.push(...ringStops);
      } else if (ring.region === 'Kose-Haapsalu ring') {
        const ringStops = await Promise.all([
          prisma.stop.create({
            data: {
              name: 'Kose',
              meetingPoint: 'Kose keskus, parkla',
              ringId: ring.id,
              sortOrder: 1
            }
          }),
          prisma.stop.create({
            data: {
              name: 'Haapsalu',
              meetingPoint: 'Haapsalu keskus, parkla',
              ringId: ring.id,
              sortOrder: 2
            }
          })
        ]);
        stops.push(...ringStops);
      } else if (ring.region === 'Rakke-Viljandi ring') {
        const ringStops = await Promise.all([
          prisma.stop.create({
            data: {
              name: 'Rakke',
              meetingPoint: 'Rakke keskus, parkla',
              ringId: ring.id,
              sortOrder: 1
            }
          }),
          prisma.stop.create({
            data: {
              name: 'Viljandi',
              meetingPoint: 'Viljandi keskus, parkla',
              ringId: ring.id,
              sortOrder: 2
            }
          })
        ]);
        stops.push(...ringStops);
      } else if (ring.region === 'Aravete-Maardu ring') {
        const ringStops = await Promise.all([
          prisma.stop.create({
            data: {
              name: 'Aravete',
              meetingPoint: 'Aravete keskus, parkla',
              ringId: ring.id,
              sortOrder: 1
            }
          }),
          prisma.stop.create({
            data: {
              name: 'Maardu',
              meetingPoint: 'Maardu keskus, parkla',
              ringId: ring.id,
              sortOrder: 2
            }
          })
        ]);
        stops.push(...ringStops);
      } else if (ring.region === 'Koeru-Vändra ring') {
        const ringStops = await Promise.all([
          prisma.stop.create({
            data: {
              name: 'Koeru',
              meetingPoint: 'Koeru keskus, parkla',
              ringId: ring.id,
              sortOrder: 1
            }
          }),
          prisma.stop.create({
            data: {
              name: 'Vändra',
              meetingPoint: 'Vändra keskus, parkla',
              ringId: ring.id,
              sortOrder: 2
            }
          })
        ]);
        stops.push(...ringStops);
      } else if (ring.region === 'Viru-Nigula-Sonda ring') {
        const ringStops = await Promise.all([
          prisma.stop.create({
            data: {
              name: 'Viru-Nigula',
              meetingPoint: 'Kodune tarne',
              ringId: ring.id,
              sortOrder: 1
            }
          }),
          prisma.stop.create({
            data: {
              name: 'Sonda',
              meetingPoint: 'Kodune tarne',
              ringId: ring.id,
              sortOrder: 2
            }
          })
        ]);
        stops.push(...ringStops);
      }
    }

    console.log(`✅ Created ${stops.length} stops`);

    // Create price list
    console.log('💰 Creating price list...');
    const priceList = await prisma.priceList.create({
      data: {
        name: 'Jaehind 2025',
        validFrom: new Date('2025-01-01'),
        validTo: new Date('2025-12-31'),
        active: true
      }
    });

    // Create products
    console.log('🛒 Creating products...');
    const products = [
      // Värske sealiha
      { sku: 'PORK-001', name: 'Esimene veerand', category: 'Värske sealiha', uom: 'TK', catchWeight: true, price: 95 },
      { sku: 'PORK-002', name: 'Tagumine veerand', category: 'Värske sealiha', uom: 'TK', catchWeight: true, price: 70 },
      { sku: 'PORK-003', name: 'Keskosa', category: 'Värske sealiha', uom: 'TK', catchWeight: true, price: 85 },
      { sku: 'PORK-004', name: 'Pool siga', category: 'Värske sealiha', uom: 'TK', catchWeight: true, price: 150 },
      { sku: 'PORK-005', name: 'Terve siga', category: 'Värske sealiha', uom: 'TK', catchWeight: true, price: 310 },
      { sku: 'PORK-006', name: 'Rebitud seakülg', category: 'Värske sealiha', uom: 'TK', catchWeight: true, price: 35 },
      { sku: 'PORK-007', name: 'Seahakkliha', category: 'Hakklihad', uom: 'KG', catchWeight: true, price: 8.50 },
      { sku: 'PORK-008', name: 'Põrsas grillimiseks', category: 'Värske sealiha', uom: 'KG', catchWeight: true, price: 0 },
      { sku: 'PORK-009', name: 'Delikatess hakkliha', category: 'Hakklihad', uom: 'KG', catchWeight: true, price: 9.50 },
      { sku: 'PORK-010', name: 'Kodune hakkliha', category: 'Hakklihad', uom: 'KG', catchWeight: true, price: 8.00 },
      
      // Tükeldamine
      { sku: 'PORK-011', name: 'Esimese veerandi tükeldamine', category: 'Värske sealiha', uom: 'TK', catchWeight: false, price: 4 },
      { sku: 'PORK-012', name: 'Tagumise veerandi tükeldamine', category: 'Värske sealiha', uom: 'TK', catchWeight: false, price: 3 },
      { sku: 'PORK-013', name: 'Keskosa tükeldamine', category: 'Värske sealiha', uom: 'TK', catchWeight: false, price: 2 },
      { sku: 'PORK-014', name: 'Poole sea tükeldamine', category: 'Värske sealiha', uom: 'TK', catchWeight: false, price: 6 },
      { sku: 'PORK-015', name: 'Terve sea tükeldamine', category: 'Värske sealiha', uom: 'TK', catchWeight: false, price: 10 },
      
      // Kinkekaart
      { sku: 'PORK-056', name: 'Kinkekaart', category: 'Kinkekaart', uom: 'TK', catchWeight: false, price: 0 }
    ];

    for (const product of products) {
      const createdProduct = await prisma.product.create({
        data: {
          sku: product.sku,
          name: product.name,
          category: product.category,
          uom: product.uom,
          catchWeight: product.catchWeight,
          active: true
        }
      });

      // Create price item
      if (product.price > 0) {
        await prisma.priceItem.create({
          data: {
            productSku: product.sku,
            priceListId: priceList.id,
            unitPrice: product.price
          }
        });
      }
    }

    console.log(`✅ Created ${products.length} products`);

    console.log('🎉 Production database seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${rings.length} rings created`);
    console.log(`   - ${stops.length} stops created`);
    console.log(`   - ${products.length} products created`);
    console.log(`   - 1 price list created`);

  } catch (error) {
    console.error('❌ Error seeding production database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedProduction()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
