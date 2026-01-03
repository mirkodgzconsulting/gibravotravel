const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando Super Seed de GiBravo Travel...');

    const clerkId = 'test_user_local_dev';

    // 1. Asegurar que existe el usuario
    await prisma.user.upsert({
        where: { clerkId: clerkId },
        update: { isActive: true },
        create: {
            clerkId: clerkId,
            email: 'admin@gibravo.it',
            firstName: 'Admin',
            lastName: 'GiBravo',
            role: 'ADMIN',
            isActive: true,
        }
    });

    // 2. Limpiar tours antiguos
    await prisma.tourAereo.deleteMany({});
    await prisma.tourBus.deleteMany({});

    const futureDate = (days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d;
    };

    console.log('✈️ Creando viajes en avión...');
    await prisma.tourAereo.createMany({
        data: [
            {
                titulo: 'Misteriosa Tailandia: Templos y Playas',
                subtitulo: 'Aventúrate en el sudeste asiático',
                precioAdulto: 1250,
                fechaViaje: futureDate(30),
                fechaFin: futureDate(42),
                isActive: true,
                isPublic: true,
                createdBy: clerkId,
                webCoverImage: 'https://images.unsplash.com/photo-1552465011-b4e21bd6e79a?q=80&w=2039&auto=format&fit=crop',
                etiquetas: ['POPULAR', 'VOLO INCLUSO'],
                descripcion: 'Un viaje inolvidable por Bangkok, Chiang Mai y las islas del sur.',
                slug: 'tour-tailandia-2024'
            },
            {
                titulo: 'Safari en Kenya: La Gran Migración',
                subtitulo: 'Naturaleza en estado puro',
                precioAdulto: 2100,
                fechaViaje: futureDate(60),
                fechaFin: futureDate(70),
                isActive: true,
                isPublic: true,
                createdBy: clerkId,
                webCoverImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2068&auto=format&fit=crop',
                etiquetas: ['ADVENTURE', 'TOP SELLER'],
                descripcion: 'Vive la experiencia de ver a los 5 grandes en su hábitat natural.',
                slug: 'safari-kenya-pro'
            }
        ]
    });

    console.log('🚌 Creando viajes en autobús...');
    await prisma.tourBus.createMany({
        data: [
            {
                titulo: 'Roma Moderna y Clásica',
                subtitulo: 'La ciudad eterna como nunca la viste',
                precioAdulto: 85,
                fechaViaje: futureDate(10),
                fechaFin: futureDate(10),
                isActive: true,
                isPublic: true,
                createdBy: clerkId,
                webCoverImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996&auto=format&fit=crop',
                etiquetas: ['BUS', 'WEEKEND'],
                descripcion: 'Un día completo explorando los secretos de Roma.',
                slug: 'roma-bus-weekend'
            },
            {
                titulo: 'Venecia: Luces sobre el Gran Canal',
                subtitulo: 'Magia italiana en cada rincón',
                precioAdulto: 95,
                fechaViaje: futureDate(15),
                fechaFin: futureDate(15),
                isActive: true,
                isPublic: true,
                createdBy: clerkId,
                webCoverImage: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?q=80&w=2070&auto=format&fit=crop',
                etiquetas: ['ROMANTIC', 'BUS'],
                descripcion: 'Disfruta de un San Marco espectacular en nuestro tour de un día.',
                slug: 'venecia-express'
            },
            {
                titulo: 'Alpes: Nieve y Relax',
                subtitulo: 'Escapada a las montañas',
                precioAdulto: 120,
                fechaViaje: futureDate(5),
                fechaFin: futureDate(7),
                isActive: true,
                isPublic: true,
                createdBy: clerkId,
                webCoverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop',
                etiquetas: ['NEVE', 'RELAX'],
                descripcion: 'El mejor aire puro de los Alpes a un paso de casa.',
                slug: 'alpes-bus-relax'
            }
        ]
    });

    console.log('✅ Base de datos poblada con éxito!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
