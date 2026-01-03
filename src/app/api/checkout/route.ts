
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

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
        const { tourId, tourType, guestData, quantity = 1 } = body;

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

        const totalAmount = price * quantity;

        // 3. Auto-Account Creation for Guests
        let finalUserId = userId;
        const client = await clerkClient();

        if (!finalUserId) {
            console.log("🔒 Guest Checkout detected. Attempting Auto-Account Creation for:", guestData.email);
            try {
                const existingUsers = await client.users.getUserList({ emailAddress: [guestData.email] });

                if (existingUsers.data.length > 0) {
                    console.log("✅ User already exists in Clerk:", existingUsers.data[0].id);
                    finalUserId = existingUsers.data[0].id;

                    // Lazy Sync check
                    const dbUser = await prisma.user.findUnique({ where: { clerkId: finalUserId } });
                    if (!dbUser) {
                        console.log("⚠️ User missing in Prisma, syncing...");
                        await prisma.user.create({
                            data: {
                                clerkId: finalUserId,
                                email: guestData.email,
                                firstName: guestData.firstName,
                                lastName: guestData.lastName,
                                phoneNumber: guestData.phone,
                                photo: existingUsers.data[0].imageUrl,
                                role: 'CLIENT'
                            }
                        });
                    }
                } else {
                    console.log("🆕 Creating NEW Clerk User...");
                    try {
                        const newUser = await client.users.createUser({
                            emailAddress: [guestData.email],
                            firstName: guestData.firstName,
                            lastName: guestData.lastName,
                            // Clerk requires strict E.164 for phones. If it fails, we shouldn't block the booking.
                            // We try adding phone, if it fails we retry without phone.
                            phoneNumber: [guestData.phone.startsWith('+') ? guestData.phone : undefined].filter(Boolean) as string[] | undefined,
                            skipPasswordRequirement: true,
                            publicMetadata: { role: "CLIENT" }
                        });
                        console.log("🎉 Clerk User Created:", newUser.id);

                        finalUserId = newUser.id;

                        await prisma.user.upsert({
                            where: { email: guestData.email },
                            update: {
                                clerkId: finalUserId,
                            },
                            create: {
                                clerkId: finalUserId,
                                email: guestData.email,
                                firstName: guestData.firstName,
                                lastName: guestData.lastName,
                                phoneNumber: guestData.phone,
                                photo: newUser.imageUrl,
                                role: 'CLIENT'
                            }
                        });
                    } catch (createError: any) {
                        console.error("❌ Failed to create Clerk User:", createError);
                        if (createError.errors) {
                            console.error("Clerk Errors:", JSON.stringify(createError.errors, null, 2));
                        }
                        // Retry without phone number if that was the issue? 
                        // For now, proceed as guest (null ID) to ensure payment works.
                    }
                }
            } catch (authErr) {
                console.error("❌ High-level Auto-Account Error:", authErr);
            }
        }

        // 4. Create Pending Booking
        // Store quantity info in adminNotes for now as we lack column
        const booking = await prisma.webBooking.create({
            data: {
                userId: finalUserId || null,
                guestName: guestData.firstName,
                guestSurname: guestData.lastName,
                guestEmail: guestData.email,
                guestPhone: guestData.phone,
                tourType: tourType.toUpperCase(),
                tourId: tourId,
                tourTitle: tourTitle,
                amountPaid: totalAmount,
                adminNotes: `Quantity: ${quantity}. Passengers: ${JSON.stringify(guestData.passengers || [])}`,
                status: "NEW",
                paymentStatus: "PENDING"
            }
        });

        // 4. Create Stripe Session
        const origin = req.headers.get("origin") || "http://localhost:3000";
        const isEmbedded = body.embedded === true;

        const sessionConfig: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: `${tourTitle} (x${quantity})`,
                            description: `Prenotazione Web - ${tourType} - ${quantity} Pax`,
                            images: [],
                        },
                        unit_amount: Math.round(price * 100),
                    },
                    quantity: quantity,
                },
            ],
            mode: "payment",
            customer_email: user?.emailAddresses[0]?.emailAddress || guestData.email,
            metadata: {
                bookingId: booking.id,
                tourId: tourId,
                qty: quantity
            }
        };

        if (isEmbedded) {
            sessionConfig.ui_mode = 'embedded';
            sessionConfig.return_url = `${origin}/prenotazione/conferma?session_id={CHECKOUT_SESSION_ID}&bookingId=${booking.id}`;
        } else {
            sessionConfig.success_url = `${origin}/prenotazione/conferma?session_id={CHECKOUT_SESSION_ID}&bookingId=${booking.id}`;
            sessionConfig.cancel_url = `${origin}/prenotazione/${tourId}?canceled=true`;
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        // 5. Update booking with Session ID
        await prisma.webBooking.update({
            where: { id: booking.id },
            data: { stripeSessionId: session.id }
        });

        if (isEmbedded) {
            return NextResponse.json({ clientSecret: session.client_secret });
        }

        return NextResponse.json({ sessionId: session.id, url: session.url });

    } catch (err: any) {
        console.error("Stripe Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
