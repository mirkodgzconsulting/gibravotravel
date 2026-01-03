import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail({
    email,
    bookingId,
    tourTitle,
    amount,
    date,
    name
}: {
    email: string;
    bookingId: string;
    tourTitle: string;
    amount: number;
    date: string;
    name: string;
}) {
    if (!process.env.RESEND_API_KEY) {
        console.error("❌ LE MANCE LA CLAVE DE RESEND (RESEND_API_KEY Missing)");
        return;
    }

    try {
        const data = await resend.emails.send({
            from: 'GiBravo Travel <noreply@gibravo.it>', // Verified Domain
            to: [email],
            subject: `Conferma Prenotazione: ${tourTitle}`,
            html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background-color: #004BA5; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">GiBravo Travel</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
                    <h2>Grazie ${name}, il tuo ordine è confermato!</h2>
                    <p>Abbiamo ricevuto il pagamento per la tua prenotazione. Ecco i dettagli:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px 0; color: #666;">Tour:</td>
                            <td style="padding: 10px 0; font-weight: bold;">${tourTitle}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px 0; color: #666;">Data:</td>
                            <td style="padding: 10px 0;">${date}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px 0; color: #666;">Totale Pagato:</td>
                            <td style="padding: 10px 0; font-weight: bold; color: #004BA5;">€${amount.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666;">ID Prenotazione:</td>
                            <td style="padding: 10px 0;">${bookingId}</td>
                        </tr>
                    </table>

                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; text-align: center; margin-top: 30px;">
                        <p style="margin-bottom: 10px; font-size: 14px; color: #666;">Gestisci la tua prenotazione:</p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/area-riservata" style="background-color: #FE8008; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Accedi all'Area Riservata</a>
                        <p style="margin-top: 10px; font-size: 12px; color: #999;">Se è la tua prima volta, utilizza l'email ${email} per accedere o impostare la password.</p>
                    </div>
                </div>
                <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
                    &copy; ${new Date().getFullYear()} GiBravo Travel - Via Padova 22, Milano.
                </div>
            </div>
            `
        });

        console.log(`📧 Email enviada a ${email}:`, data);
        return data;
    } catch (error) {
        console.error("❌ Error enviando email:", error);
    }
}
