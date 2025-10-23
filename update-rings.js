const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateRings() {
  console.log('🗑️  Clearing existing rings and stops...');
  
  // Delete all stops first (due to foreign key constraints)
  await prisma.stop.deleteMany();
  console.log('✅ Deleted all stops');
  
  // Delete all rings
  await prisma.ring.deleteMany();
  console.log('✅ Deleted all rings');
  
  console.log('🔄 Creating rings with new naming convention...');
  
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
    
    console.log(`📦 Creating ${ringName}...`);
    
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

  console.log('🎉 Rings updated successfully!');
  console.log('New ring names:');
  const updatedRings = await prisma.ring.findMany({
    select: { region: true, ringDate: true }
  });
  updatedRings.forEach(ring => {
    console.log(`  - ${ring.region} (${ring.ringDate.toISOString().split('T')[0]})`);
  });
}

updateRings()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

