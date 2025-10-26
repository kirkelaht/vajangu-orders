import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.ring.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.priceItem.deleteMany();
  await prisma.priceList.deleteMany();
  await prisma.product.deleteMany();

  // Create products by category
  const products = [
    // Värske sealiha (kg + tk + tükeldus)
    { sku: 'PORK-001', name: 'Esimene veerand', category: 'Värske sealiha', uom: 'TK', catchWeight: true },
    { sku: 'PORK-002', name: 'Tagumine veerand', category: 'Värske sealiha', uom: 'TK', catchWeight: true },
    { sku: 'PORK-003', name: 'Pool/terve siga', category: 'Värske sealiha', uom: 'TK', catchWeight: true },
    { sku: 'PORK-004', name: 'Keskosa', category: 'Värske sealiha', uom: 'TK', catchWeight: true },
    { sku: 'PORK-005', name: 'Kampaania sealiha 1-16 kg', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-006', name: 'Seahakkliha', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-007', name: 'Delikatess hakkliha', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-008', name: 'Kaelakarbonaad', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-009', name: 'Ahjuribi', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-010', name: 'Ribi', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-011', name: 'Seljakarbonaad', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-012', name: 'Delikatess ribi', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-013', name: 'Välisfilee', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-014', name: 'Rebitud külg', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-015', name: 'Praad kondiga', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-016', name: 'Sisefilee', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-017', name: 'Pehme praad', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-018', name: 'Pehme abaliha', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-019', name: 'Abaliha kamaraga', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-020', name: 'Abaliha kondi ja kamaraga', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-021', name: 'Peekon', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-022', name: 'Delikatess medaljon', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-023', name: 'Sool', category: 'Värske sealiha', uom: 'KG', catchWeight: true },
    { sku: 'PORK-024', name: 'Grillpõrsas', category: 'Värske sealiha', uom: 'KG', catchWeight: true },

    // Värske veiseliha
    { sku: 'BEEF-001', name: 'Kodune hakkliha', category: 'Värske veiseliha', uom: 'KG', catchWeight: true },
    { sku: 'BEEF-002', name: 'Veisemaks', category: 'Värske veiseliha', uom: 'KG', catchWeight: true },
    { sku: 'BEEF-003', name: 'Veisehakkliha', category: 'Värske veiseliha', uom: 'KG', catchWeight: true },

    // Grilltooted
    { sku: 'GRILL-001', name: 'Toorvorst', category: 'Grilltooted', uom: 'KG', catchWeight: true },
    { sku: 'GRILL-002', name: 'Ahjuvorst', category: 'Grilltooted', uom: 'KG', catchWeight: true },
    { sku: 'GRILL-003', name: 'Grill-liha', category: 'Grilltooted', uom: 'KG', catchWeight: true },
    { sku: 'GRILL-004', name: 'Grill-koot', category: 'Grilltooted', uom: 'KG', catchWeight: true },
    { sku: 'GRILL-005', name: 'Grill-peekon', category: 'Grilltooted', uom: 'KG', catchWeight: true },
    { sku: 'GRILL-006', name: 'Grill-ribi', category: 'Grilltooted', uom: 'KG', catchWeight: true },
    { sku: 'GRILL-007', name: 'Ahjupraad', category: 'Grilltooted', uom: 'KG', catchWeight: true },
    { sku: 'GRILL-008', name: 'Äädika šašlõkk', category: 'Grilltooted', uom: 'KG', catchWeight: true },
    { sku: 'GRILL-009', name: 'Kebabi saslõkk', category: 'Grilltooted', uom: 'KG', catchWeight: true },
    { sku: 'GRILL-010', name: 'Keefiri šašlõkk', category: 'Grilltooted', uom: 'KG', catchWeight: true },
    { sku: 'GRILL-011', name: 'Erinevad šašlõkk', category: 'Grilltooted', uom: 'KG', catchWeight: true },
    { sku: 'GRILL-012', name: 'Mahlane šašlõkk', category: 'Grilltooted', uom: 'KG', catchWeight: true },

    // Konservid ja suitsutooted
    { sku: 'SMOKE-001', name: 'PS küüslaugu tk', category: 'Konservid ja suitsutooted', uom: 'TK', catchWeight: false },
    { sku: 'SMOKE-002', name: 'Suitsuribi', category: 'Konservid ja suitsutooted', uom: 'KG', catchWeight: true },
    { sku: 'SMOKE-003', name: 'Viiner', category: 'Konservid ja suitsutooted', uom: 'KG', catchWeight: true },
    { sku: 'SMOKE-004', name: 'Taisink kamaraga', category: 'Konservid ja suitsutooted', uom: 'KG', catchWeight: true },
    { sku: 'SMOKE-005', name: 'Vinnutatud sealiha', category: 'Konservid ja suitsutooted', uom: 'KG', catchWeight: true },
    { sku: 'SMOKE-006', name: 'Soolapekk', category: 'Konservid ja suitsutooted', uom: 'KG', catchWeight: true },
    { sku: 'SMOKE-007', name: 'Pasteet plokk', category: 'Konservid ja suitsutooted', uom: 'KG', catchWeight: true },
    { sku: 'SMOKE-008', name: 'Pasteet tk', category: 'Konservid ja suitsutooted', uom: 'TK', catchWeight: false },
    { sku: 'SMOKE-009', name: 'Šašlõkivorst', category: 'Konservid ja suitsutooted', uom: 'KG', catchWeight: true },
    { sku: 'SMOKE-010', name: 'Sealihakonserv tk', category: 'Konservid ja suitsutooted', uom: 'TK', catchWeight: false },
    { sku: 'SMOKE-011', name: 'Sealihakonserv plokk', category: 'Konservid ja suitsutooted', uom: 'KG', catchWeight: true },
    { sku: 'SMOKE-012', name: 'Suitsukoot', category: 'Konservid ja suitsutooted', uom: 'KG', catchWeight: true },
    { sku: 'SMOKE-013', name: 'Taisink', category: 'Konservid ja suitsutooted', uom: 'KG', catchWeight: true },
    { sku: 'SMOKE-014', name: 'Kampaania suitsuliha', category: 'Konservid ja suitsutooted', uom: 'KG', catchWeight: true },
    { sku: 'SMOKE-015', name: 'TS Roela tk', category: 'Konservid ja suitsutooted', uom: 'TK', catchWeight: false },

    // Subproduktid
    { sku: 'SUB-001', name: 'Pekiliha', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-002', name: 'Lemmik', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-003', name: 'Maks', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-004', name: 'Põseliha', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-005', name: 'Jalg', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-006', name: 'Saba', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-007', name: 'Pea', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-008', name: 'Neer', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-009', name: 'Rulaadikamar', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-010', name: 'Süda', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-011', name: 'Kondid', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-012', name: 'Ploomirasv', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-013', name: 'Raguu', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-014', name: 'Keel', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-015', name: 'Kamar', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-016', name: 'Kõrvad', category: 'Subproduktid', uom: 'KG', catchWeight: true },
    { sku: 'SUB-017', name: 'Koot', category: 'Subproduktid', uom: 'KG', catchWeight: true },

    // Kulinaaria
    { sku: 'CUL-001', name: 'Paneeritud šnitsel', category: 'Kulinaaria', uom: 'KG', catchWeight: true },
    { sku: 'CUL-002', name: 'Seljalõik', category: 'Kulinaaria', uom: 'KG', catchWeight: true },
    { sku: 'CUL-003', name: 'Kotlet', category: 'Kulinaaria', uom: 'KG', catchWeight: true },
    { sku: 'CUL-004', name: 'Koodisteik', category: 'Kulinaaria', uom: 'KG', catchWeight: true },
    { sku: 'CUL-005', name: 'Supiliha', category: 'Kulinaaria', uom: 'KG', catchWeight: true },
    { sku: 'CUL-006', name: 'Ribilõik', category: 'Kulinaaria', uom: 'KG', catchWeight: true },
    { sku: 'CUL-007', name: 'Praelõik kamaraga', category: 'Kulinaaria', uom: 'KG', catchWeight: true },
    { sku: 'CUL-008', name: 'Liblikas', category: 'Kulinaaria', uom: 'KG', catchWeight: true },
    { sku: 'CUL-009', name: 'Peekoniviil', category: 'Kulinaaria', uom: 'KG', catchWeight: true },
    { sku: 'CUL-010', name: 'Šnitsel', category: 'Kulinaaria', uom: 'KG', catchWeight: true },
    { sku: 'CUL-011', name: 'Seatiivad', category: 'Kulinaaria', uom: 'KG', catchWeight: true },
    { sku: 'CUL-012', name: 'Karree lõik', category: 'Kulinaaria', uom: 'KG', catchWeight: true },
    { sku: 'CUL-013', name: 'Šašlõkikuubikud', category: 'Kulinaaria', uom: 'KG', catchWeight: true },

    // Selle kuu pakkumised
    { sku: 'SPEC-001', name: 'Selle kuu pakkumised', category: 'Selle kuu pakkumised', uom: 'KG', catchWeight: true },
  ];

  // Create products
  for (const product of products) {
    await prisma.product.create({
      data: {
        ...product,
        uom: product.uom as 'KG' | 'TK'
      },
    });
  }

  console.log(`✅ Created ${products.length} products`);

  // Create price lists
  const retailPriceList = await prisma.priceList.create({
    data: {
      name: 'Jaeklientide hinnakiri',
      segment: 'RETAIL',
      valid_from: new Date(),
    },
  });

  const restaurantPriceList = await prisma.priceList.create({
    data: {
      name: 'Restoranide hinnakiri',
      segment: 'RESTAURANT',
      valid_from: new Date(),
    },
  });

  const wholesalePriceList = await prisma.priceList.create({
    data: {
      name: 'Hulgiklientide hinnakiri',
      segment: 'WHOLESALE',
      valid_from: new Date(),
    },
  });

  console.log('✅ Created price lists');

  // Create rings based on actual Vajangu Perefarm delivery schedule (October 2025)
  const rings = [
    {
      date: '2025-10-08',
      driver: 'Marvi Laht',
      cutoff: '2025-10-06',
      stops: ['Vändra', 'Tootsi', 'Selja', 'Sindi', 'Paikuse', 'Pärnu', 'Sauga', 'Are', 'Pärnu-Jaagupi', 'Libatse', 'Enge']
    },
    {
      date: '2025-10-09',
      driver: 'Marvi Laht',
      cutoff: '2025-10-07',
      stops: ['Viru-Nigula', 'Purtse', 'Jõhvi', 'Voka', 'Pühajõe', 'Toila', 'Kohtla-Järve', 'Kiviõli', 'Sonda']
    },
    {
      date: '2025-10-10',
      driver: 'Marvi Laht',
      cutoff: '2025-10-07',
      stops: ['Järva-Jaani', 'Roosna-Alliku', 'Paide', 'Türi', 'Käru', 'Lelle', 'Kehtna', 'Rapla', 'Märjamaa', 'Laukna', 'Koluvere', 'Kullamaa', 'Lihula', 'Kõmsi']
    },
    {
      date: '2025-10-15',
      driver: 'Marvi Laht',
      cutoff: '2025-10-12',
      stops: ['Kose', 'Keila', 'Vasalemma', 'Ämari', 'Riisipere', 'Turba', 'Risti', 'Palivere', 'Taebla', 'Linnamäe', 'Haapsalu']
    },
    {
      date: '2025-10-16',
      driver: 'Marvi Laht',
      cutoff: '2025-10-14',
      stops: ['Viru-Nigula', 'Purtse', 'Jõhvi', 'Voka', 'Pühajõe', 'Toila', 'Kohtla-Järve', 'Kiviõli', 'Sonda']
    },
    {
      date: '2025-10-17',
      driver: 'Marvi Laht',
      cutoff: '2025-10-14',
      stops: ['Rakke', 'Jõgeva', 'Tartu', 'Elva', 'Rõngu', 'Tõrva', 'Helme', 'Ala', 'Karksi-Nuia', 'Abja-Paluoja', 'Kulla', 'Halliste', 'Õisu', 'Sultsi', 'Viljandi']
    },
    {
      date: '2025-10-22',
      driver: 'Marvi Laht',
      cutoff: '2025-10-18',
      stops: ['Aravete', 'Jäneda', 'Aegviidu', 'Anija', 'Kehra', 'Raasiku', 'Aruküla', 'Jüri', 'Kiili', 'Luige', 'Saku', 'Ääsmäe', 'Saue', 'Tallinn (Tondi)', 'Tallinn (Lasnamäe)', 'Mähe', 'Muuga', 'Maardu']
    },
    {
      date: '2025-10-24',
      driver: 'Marvi Laht',
      cutoff: '2025-10-21',
      stops: ['Koeru', 'Imavere', 'Võhma', 'Olustvere', 'Suure-Jaani', 'Vastemõisa', 'Savikoti', 'Kõpu', 'Kilingi-Nõmme', 'Pärnu', 'Vändra']
    }
  ];

  // Create rings and stops
  for (const ringData of rings) {
    // Generate ring name from first and last stop
    const firstStop = ringData.stops[0];
    const lastStop = ringData.stops[ringData.stops.length - 1];
    const ringName = `${firstStop}-${lastStop} ring`;
    
    const ring = await prisma.ring.create({
      data: {
        ringDate: new Date(ringData.date),
        region: ringName,
        driver: ringData.driver,
        visibleFrom: new Date('2025-10-01'),
        visibleTo: new Date(ringData.date),
        cutoffAt: new Date(`${ringData.cutoff}T23:59:00Z`),
        capacityOrders: 50,
        capacityKg: 1000,
        status: 'OPEN',
      },
    });

    // Create stops for this ring
    for (let i = 0; i < ringData.stops.length; i++) {
      const stopName = ringData.stops[i];
      const baseTime = new Date(ringData.date);
      baseTime.setHours(14 + Math.floor(i / 3)); // Start at 14:00, add time for each stop
      baseTime.setMinutes((i % 3) * 20); // 20 minutes between stops
      
      await prisma.stop.create({
        data: {
          ringId: ring.id,
          name: stopName,
          meetingPoint: stopName.includes('Tallinn') ? 'Peatuskoht' : 'Keskus',
          timeStart: new Date(baseTime),
          timeEnd: new Date(baseTime.getTime() + 30 * 60000), // 30 minutes per stop
          sortOrder: i + 1,
        },
      });
    }
  }

  console.log('✅ Created sample stops');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
