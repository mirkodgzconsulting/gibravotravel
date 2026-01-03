import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import Stripe from 'stripe'
import { sendOrderConfirmationEmail } from "@/lib/email"

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
    typescript: true,
})

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature') as string

    let event: Stripe.Event

    // 1. Verify Signature
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // 2. Handle Event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session

        // Retrieve metadata (userId, tourId, etc if needed) 
        // BUT we rely on client_reference_id for the Booking ID if we set it, 
        // OR we stored the Stripe Session ID in the DB.

        // In /api/checkout/route.ts we did:
        // await prisma.webBooking.create({ data: { stripeSessionId: session.id ... } })

        // So now we find the booking by stripeSessionId
        try {
            if (!session.id) throw new Error("No session ID")

            const booking = await prisma.webBooking.findFirst({
                where: { stripeSessionId: session.id }
            })

            if (booking) {
                await prisma.webBooking.update({
                    where: { id: booking.id },
                    data: {
                        status: 'CONFIRMED',
                        paymentStatus: 'PAID',
                        paymentMethod: 'STRIPE',
                        amountPaid: session.amount_total ? session.amount_total / 100 : 0
                    }
                })
                console.log(`✅ Booking ${booking.id} confirmed via Webhook`)

                // SEND EMAIL
                try {
                    await sendOrderConfirmationEmail({
                        email: booking.guestEmail,
                        name: booking.guestName,
                        bookingId: booking.id,
                        tourTitle: booking.tourTitle,
                        amount: session.amount_total ? session.amount_total / 100 : 0,
                        date: new Date().toLocaleDateString('it-IT')
                    })
                } catch (emailErr) {
                    console.error("❌ Failed to send email:", emailErr)
                }
            } else {
                console.error(`❌ Booking not found for Session ${session.id}`)
            }

        } catch (e) {
            console.error("Error updating booking:", e)
            return new Response("Error updating booking", { status: 500 })
        }
    }

    return new Response(null, { status: 200 })
}
