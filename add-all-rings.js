const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addAllRings() {
  console.log('🗑️  Clearing existing rings and stops...');
  
  // Delete all stops first (due to foreign key constraints)
  await prisma.stop.deleteMany();
  console.log('✅ Deleted all stops');
  
  // Delete all rings
  await prisma.ring.deleteMany();
  console.log('✅ Deleted all rings');
  
  console.log('🔄 Creating all rings with new naming convention...');
  
  // All rings with their stops and meeting points
  const rings = [
    {
      date: '2025-10-08',
      stops: [
        { name: 'Vändra', meetingPoint: 'Grossi poe parkla' },
        { name: 'Tootsi', meetingPoint: 'bussijaama parkla (Coop poe vastas)' },
        { name: 'Selja', meetingPoint: 'söökla parkla (Coopi poe juures)' },
        { name: 'Sindi', meetingPoint: 'Coopi poe vastas parklas' },
        { name: 'Paikuse', meetingPoint: 'Coopi poe vastas turu parklas' },
        { name: 'Pärnu', meetingPoint: 'Port Arturi vastas jõe äärese parklas, taaraautomaadi juures (seal samas parklas ka käsipesula)' },
        { name: 'Sauga', meetingPoint: 'Täkupoisi tankla (Alexela)' },
        { name: 'Are', meetingPoint: 'vana meierei parkla' },
        { name: 'Pärnu-Jaagupi', meetingPoint: 'turu parkla (Kuuse poe parkla)' },
        { name: 'Libatse', meetingPoint: 'maantee ääres poe parkla' },
        { name: 'Enge', meetingPoint: 'Olerexi tankla' }
      ]
    },
    {
      date: '2025-10-09',
      stops: ['Viru-Nigula', 'Purtse', 'Jõhvi', 'Voka', 'Pühajõe', 'Toila', 'Kohtla-Järve', 'Kiviõli', 'Sonda'].map(name => ({ name, meetingPoint: 'Keskus' }))
    },
    {
      date: '2025-10-10',
      stops: ['Järva-Jaani', 'Roosna-Alliku', 'Paide', 'Türi', 'Käru', 'Lelle', 'Kehtna', 'Rapla', 'Märjamaa', 'Laukna', 'Koluvere', 'Kullamaa', 'Lihula', 'Kõmsi'].map(name => ({ name, meetingPoint: 'Keskus' }))
    },
    {
      date: '2025-10-15',
      stops: ['Kose', 'Keila', 'Vasalemma', 'Ämari', 'Riisipere', 'Turba', 'Risti', 'Palivere', 'Taebla', 'Linnamäe', 'Haapsalu'].map(name => ({ name, meetingPoint: 'Keskus' }))
    },
    {
      date: '2025-10-16',
      stops: ['Viru-Nigula', 'Purtse', 'Jõhvi', 'Voka', 'Pühajõe', 'Toila', 'Kohtla-Järve', 'Kiviõli', 'Sonda'].map(name => ({ name, meetingPoint: 'Keskus' }))
    },
    {
      date: '2025-10-17',
      stops: ['Rakke', 'Jõgeva', 'Tartu', 'Elva', 'Rõngu', 'Tõrva', 'Helme', 'Ala', 'Karksi-Nuia', 'Abja-Paluoja', 'Kulla', 'Halliste', 'Õisu', 'Sultsi', 'Viljandi'].map(name => ({ name, meetingPoint: 'Keskus' }))
    },
    {
      date: '2025-10-22',
      stops: ['Aravete', 'Jäneda', 'Aegviidu', 'Anija', 'Kehra', 'Raasiku', 'Aruküla', 'Jüri', 'Kiili', 'Luige', 'Saku', 'Ääsmäe', 'Saue', 'Tallinn (Tondi)', 'Tallinn (Lasnamäe)', 'Mähe', 'Muuga', 'Maardu'].map(name => ({ name, meetingPoint: name.includes('Tallinn') ? 'Peatuskoht' : 'Keskus' }))
    },
    {
      date: '2025-10-24',
      stops: ['Koeru', 'Imavere', 'Võhma', 'Olustvere', 'Suure-Jaani', 'Vastemõisa', 'Savikoti', 'Kõpu', 'Kilingi-Nõmme', 'Pärnu', 'Vändra'].map(name => ({ name, meetingPoint: 'Keskus' }))
    }
  ];

  // Create rings and stops
  for (const ringData of rings) {
    // Generate ring name from first and last stop
    const firstStop = ringData.stops[0].name || ringData.stops[0];
    const lastStop = ringData.stops[ringData.stops.length - 1].name || ringData.stops[ringData.stops.length - 1];
    const ringName = `${firstStop}-${lastStop} ring`;
    
    // Calculate cutoff date (T-2 days)
    const cutoffDate = new Date(ringData.date);
    cutoffDate.setDate(cutoffDate.getDate() - 2);
    
    console.log(`📦 Creating ${ringName} (${ringData.date})...`);
    
    const ring = await prisma.ring.create({
      data: {
        ringDate: new Date(ringData.date),
        region: ringName,
        driver: 'Marvi Laht',
        visibleFrom: new Date('2025-10-01'),
        visibleTo: new Date(ringData.date),
        cutoffAt: new Date(`${cutoffDate.toISOString().split('T')[0]}T23:59:00Z`),
        capacityOrders: 50,
        capacityKg: 1000,
        status: 'OPEN',
      },
    });

    // Create stops for this ring
    for (let i = 0; i < ringData.stops.length; i++) {
      const stop = ringData.stops[i];
      const baseTime = new Date(ringData.date);
      baseTime.setHours(14 + Math.floor(i / 3)); // Start at 14:00, add time for each stop
      baseTime.setMinutes((i % 3) * 20); // 20 minutes between stops
      
      await prisma.stop.create({
        data: {
          ringId: ring.id,
          name: stop.name,
          meetingPoint: stop.meetingPoint,
          timeStart: new Date(baseTime),
          timeEnd: new Date(baseTime.getTime() + 30 * 60000), // 30 minutes per stop
          sortOrder: i + 1,
        },
      });
    }
  }

  console.log('🎉 All rings created successfully!');
  console.log('\n📋 Ring Summary:');
  const updatedRings = await prisma.ring.findMany({
    select: { region: true, ringDate: true, cutoffAt: true },
    orderBy: { ringDate: 'asc' }
  });
  updatedRings.forEach(ring => {
    console.log(`  - ${ring.region}`);
    console.log(`    Date: ${ring.ringDate.toISOString().split('T')[0]}`);
    console.log(`    Cutoff: ${ring.cutoffAt.toISOString().split('T')[0]} 23:59`);
    console.log('');
  });
}

addAllRings()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
