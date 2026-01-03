const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const today = new Date();
    console.log('Today:', today);

    const aereoCount = await prisma.tourAereo.count();
    const busCount = await prisma.tourBus.count();
    console.log('Total TourAereo in DB:', aereoCount);
    console.log('Total TourBus in DB:', busCount);

    const aereoActive = await prisma.tourAereo.findMany({
        where: { isActive: true, isPublic: true },
        select: { id: true, titulo: true, fechaViaje: true }
    });
    console.log('Active & Public TourAereo:', aereoActive.length);
    aereoActive.forEach(t => console.log(`- ${t.titulo}: ${t.fechaViaje}`));

    const busActive = await prisma.tourBus.findMany({
        where: { isActive: true, isPublic: true },
        select: { id: true, titulo: true, fechaViaje: true }
    });
    console.log('Active & Public TourBus:', busActive.length);
    busActive.forEach(t => console.log(`- ${t.titulo}: ${t.fechaViaje}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
