
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Debugging Fee AGV Calculation (Advanced)...');

    // 1. Check Jan 2026 based on Fecha Viaje (Correct Logic)
    const startJan26 = new Date('2026-01-01T00:00:00.000Z');
    const endJan26 = new Date('2026-01-31T23:59:59.999Z');

    console.log(`\n📅 Checking Tours with Fecha Viaje in JAN 2026 (${startJan26.toISOString()} - ${endJan26.toISOString()})`);

    const toursViaje = await prisma.tourAereo.findMany({
        where: {
            isActive: true,
            fechaViaje: {
                gte: startJan26,
                lte: endJan26,
            },
        },
        select: { id: true, titulo: true, fechaViaje: true, createdAt: true, feeAgv: true },
    });

    const formatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
    let totalViaje = 0;

    toursViaje.forEach(t => {
        totalViaje += (t.feeAgv || 0);
        console.log(`  - [Viaje: ${t.fechaViaje?.toISOString().split('T')[0]}] [Created: ${t.createdAt.toISOString().split('T')[0]}] ${t.titulo}: ${formatter.format(t.feeAgv || 0)}`);
    });
    console.log(`  💰 TOTAL (By Fecha Viaje): ${formatter.format(totalViaje)}`);


    // 2. Check Jan 2026 based on CreatedAt (User Hypothesis)
    console.log(`\n📅 Checking Tours CREATED in JAN 2026 (User Hypothesis)`);

    const toursCreated = await prisma.tourAereo.findMany({
        where: {
            isActive: true,
            createdAt: {
                gte: startJan26,
                lte: endJan26,
            },
        },
        select: { id: true, titulo: true, fechaViaje: true, createdAt: true, feeAgv: true },
    });

    let totalCreated = 0;
    toursCreated.forEach(t => {
        totalCreated += (t.feeAgv || 0);
        console.log(`  - [Viaje: ${t.fechaViaje?.toISOString().split('T')[0]}] [Created: ${t.createdAt.toISOString().split('T')[0]}] ${t.titulo}: ${formatter.format(t.feeAgv || 0)}`);
    });
    console.log(`  💰 TOTAL (By CreatedAt): ${formatter.format(totalCreated)}`);

    // 3. Dump specific tours mentioned by user
    console.log(`\n🔍 Looking for tours with specific amounts (1887.35 or -44.57)`);
    const suspiciousTours = await prisma.tourAereo.findMany({
        where: {
            OR: [
                { feeAgv: { gte: 1887, lte: 1888 } },
                { feeAgv: { gte: -45, lte: -44 } }
            ]
        },
        select: { id: true, titulo: true, fechaViaje: true, feeAgv: true, isActive: true }
    });

    suspiciousTours.forEach(t => {
        console.log(`  - Found: ${t.titulo} | Fee: ${t.feeAgv} | Date: ${t.fechaViaje?.toISOString()} | Active: ${t.isActive}`);
    });

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
