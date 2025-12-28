
import { prisma } from '@/lib/prisma';

async function main() {
    const today = new Date();
    console.log('Today:', today.toISOString());

    const aereoCount = await prisma.tourAereo.count({
        where: {
            fechaViaje: { gte: today },
            isPublic: true
        }
    });

    const busCount = await prisma.tourBus.count({
        where: {
            fechaViaje: { gte: today },
            isPublic: true
        }
    });

    // Also count TOTAL to see if dates are the issue
    const totalAereo = await prisma.tourAereo.count();
    const totalBus = await prisma.tourBus.count();

    console.log(`\nRESULTS:`);
    console.log(`Total Aereo in DB: ${totalAereo}`);
    console.log(`Future Public Aereo: ${aereoCount}`);

    console.log(`Total Bus in DB: ${totalBus}`);
    console.log(`Future Public Bus: ${busCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
