import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardClient } from "./dashboard-client"

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const user = await currentUser()

    if (!user) {
        redirect("/sign-in?redirect_url=/dashboard")
    }

    // 1. Fetch User's Web Bookings from the new independent table
    const webBookings = await prisma.webBooking.findMany({
        where: {
            userId: user.id
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    // 2. Prepare User Data for Client
    const userData = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress || "",
        imageUrl: user.imageUrl
    }

    // 3. Render Client Component
    return (
        <DashboardClient
            userData={userData}
            bookings={webBookings}
        />
    )
}
