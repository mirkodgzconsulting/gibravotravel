
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking for data inconsistencies...');

    // 1. Check VentaTourAereo orphans
    console.log('\n--- Checking VentaTourAereo Orphans ---');
    const ventasAereo = await prisma.ventaTourAereo.findMany({
        select: { id: true, tourAereoId: true, venduto: true, tourAereo: { select: { id: true, isActive: true } } }
    });

    let orphansAereo = 0;
    let inactiveParentAereo = 0;

    for (const venta of ventasAereo) {
        if (!venta.tourAereo) {
            console.log(`❌ VentaTourAereo Orphan Found! ID: ${venta.id}, TourID: ${venta.tourAereoId}, Amount: ${venta.venduto}`);
            orphansAereo++;
        } else if (!venta.tourAereo.isActive) {
            // console.log(`⚠️ VentaTourAereo with Inactive Parent. ID: ${venta.id}, TourID: ${venta.tourAereoId}, Amount: ${venta.venduto}`);
            inactiveParentAereo++;
        }
    }
    console.log(`Results: ${orphansAereo} orphans, ${inactiveParentAereo} with inactive parent.`);


    // 2. Check VentaTourBus orphans
    console.log('\n--- Checking VentaTourBus Orphans ---');
    const ventasBus = await prisma.ventaTourBus.findMany({
        select: { id: true, tourBusId: true, totalAPagar: true, tourBus: { select: { id: true, isActive: true } } }
    });

    let orphansBus = 0;
    let inactiveParentBus = 0;

    for (const venta of ventasBus) {
        if (!venta.tourBus) {
            console.log(`❌ VentaTourBus Orphan Found! ID: ${venta.id}, TourID: ${venta.tourBusId}, Amount: ${venta.totalAPagar}`);
            orphansBus++;
        } else if (!venta.tourBus.isActive) {
            inactiveParentBus++;
        }
    }
    console.log(`Results: ${orphansBus} orphans, ${inactiveParentBus} with inactive parent.`);

    // 3. Check VentaAsiento orphans
    console.log('\n--- Checking VentaAsiento Orphans ---');
    const ventasAsiento = await prisma.ventaAsiento.findMany({
        select: { id: true, tourBusId: true, precioVenta: true, tourBus: { select: { id: true, isActive: true } } }
    });

    let orphansAsiento = 0;
    for (const venta of ventasAsiento) {
        if (!venta.tourBus) {
            console.log(`❌ VentaAsiento Orphan Found! ID: ${venta.id}, TourID: ${venta.tourBusId}`);
            orphansAsiento++;
        }
    }
    console.log(`Results: ${orphansAsiento} orphans.`);

    console.log('\n✅ Check completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
