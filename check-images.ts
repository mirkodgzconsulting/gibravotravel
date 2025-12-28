
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Check Images...')

    const busTours = await prisma.tourBus.findMany({ select: { coverImage: true, id: true }, take: 3 })
    const flightTours = await prisma.tourAereo.findMany({ select: { coverImage: true, id: true }, take: 3 })

    console.log('BUS IMAGES:', busTours)
    console.log('FLIGHT IMAGES:', flightTours)
}

main()
