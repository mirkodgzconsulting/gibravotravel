
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { currentUser } from "@clerk/nextjs/server";

// Initialize Stripe (Lazy init inside handler to avoid build errors if env missing)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2023-10-16" as any, // Use latest supported
});

export async function POST(req: Request) {
    try {
        // 1. Auth Check (Optional but recommended)
        const user = await currentUser();
        const userId = user?.id; // Clerk ID

        const body = await req.json();
        const { tourId, tourType, guestData } = body;

        // 2. Validate Tour
        let tourTitle = "";
        let price = 0;

        if (tourType === 'aereo') {
            const t = await prisma.tourAereo.findUnique({ where: { id: tourId } });
            if (!t) return NextResponse.json({ error: "Tour not found" }, { status: 404 });
            tourTitle = t.titulo;
            price = t.precioAdulto;
        } else {
            const t = await prisma.tourBus.findUnique({ where: { id: tourId } });
            if (!t) return NextResponse.json({ error: "Tour not found" }, { status: 404 });
            tourTitle = t.titulo;
            price = t.precioAdulto;
        }

        // 3. Create Pending Booking in Independent Table
        // We create it BEFORE Stripe to have a record. Status: PENDING.
        const booking = await prisma.webBooking.create({
            data: {
                userId: userId || null, // Optional if guest
                guestName: guestData.firstName,
                guestSurname: guestData.lastName,
                guestEmail: guestData.email,
                guestPhone: guestData.phone,
                tourType: tourType.toUpperCase(),
                tourId: tourId,
                tourTitle: tourTitle,
                amountPaid: price, // Full amount for now
                status: "NEW",
                paymentStatus: "PENDING"
            }
        });

        // 4. Create Stripe Session
        const origin = req.headers.get("origin") || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: tourTitle,
                            description: `Prenotazione Web - ${tourType}`,
                            images: [], // Can add tour image here
                        },
                        unit_amount: Math.round(price * 100), // Cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${origin}/dashboard?success=true&bookingId=${booking.id}`, // Redirect to Dashboard on success
            cancel_url: `${origin}/prenotazione/${tourId}?canceled=true`,
            customer_email: user?.emailAddresses[0]?.emailAddress || guestData.email, // Pre-fill email in Stripe
            metadata: {
                bookingId: booking.id, // Link Stripe -> WebBooking
                tourId: tourId
            }
        });

        // 5. Update booking with Session ID
        await prisma.webBooking.update({
            where: { id: booking.id },
            data: { stripeSessionId: session.id }
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });

    } catch (err: any) {
        console.error("Stripe Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
