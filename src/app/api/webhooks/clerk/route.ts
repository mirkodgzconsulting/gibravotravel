import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from "@/lib/prisma"
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    // Get the headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400
        })
    }

    // Handle the event
    const eventType = evt.type

    // 1. CREATE USER
    if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name, image_url, phone_numbers } = evt.data
        const email = email_addresses[0]?.email_address
        const phone = phone_numbers[0]?.phone_number

        // Default Role: USER
        // Only internal emails should be ADMIN (can be implemented later)

        try {
            await prisma.user.create({
                data: {
                    clerkId: id,
                    email: email,
                    firstName: first_name,
                    lastName: last_name,
                    photo: image_url,
                    phoneNumber: phone,
                    role: 'USER', // Default for web signups
                }
            })
            console.log(`User created: ${id}`)
        } catch (e) {
            console.error("Error creating user in DB:", e)
            // If user already exists (e.g. created manually), we could attempt to update link basically
            // But for unique constrains it will fail.
        }
    }

    // 2. UPDATE USER
    if (eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name, image_url, phone_numbers } = evt.data
        const email = email_addresses[0]?.email_address
        const phone = phone_numbers[0]?.phone_number

        try {
            await prisma.user.update({
                where: { clerkId: id },
                data: {
                    email: email,
                    firstName: first_name,
                    lastName: last_name,
                    photo: image_url,
                    phoneNumber: phone,
                }
            })
            console.log(`User updated: ${id}`)
        } catch (e) {
            console.error("Error updating user in DB:", e)
        }
    }

    // 3. DELETE USER
    if (eventType === 'user.deleted') {
        const { id } = evt.data
        if (id) {
            try {
                // We decided to keep data usually, but we could mark inactive.
                // For now we just mark inactive if the schema supports it, or delete.
                // The schema has 'isActive'
                await prisma.user.update({
                    where: { clerkId: id },
                    data: { isActive: false }
                })
                console.log(`User marked inactive: ${id}`)
            } catch (e) {
                console.error("Error deleting user in DB:", e)
            }
        }
    }

    return new Response('', { status: 200 })
}
