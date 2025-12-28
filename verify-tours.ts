
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Verificando conexión a base de datos...')

    try {
        const busTours = await prisma.tourBus.count({
            where: { isActive: true }
        })

        const flightTours = await prisma.tourAereo.count({
            where: { isActive: true }
        })

        console.log(`✅ Conexión exitosa.`)
        console.log(`🚌 Tours de Bus Activos: ${busTours}`)
        console.log(`✈️  Tours Aéreos Activos: ${flightTours}`)

        if (busTours === 0 && flightTours === 0) {
            console.log('⚠️  No hay tours activos. La página se verá vacía, pero funciona.')
        }

    } catch (error) {
        console.error('❌ Error conectando a la BD:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
