"use client"

import { useState, useEffect } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import PersonalDetails from '@/components/shadcn-studio/blocks/checkout-page-03/PersonalDetails'
import ShippingAdress from '@/components/shadcn-studio/blocks/checkout-page-03/ShippingAddress'
import PaymentInfo from '@/components/shadcn-studio/blocks/checkout-page-03/PaymentInfo'
import { useRouter } from 'next/navigation'

const Checkout = () => {
    const router = useRouter()
    const [activeAccordionItem, setActiveAccordionItem] = useState<string>('item-1')
    const [cartData, setCartData] = useState<any>(null)

    // Accumulated Data
    const [accountData, setAccountData] = useState<any>({ firstName: '', lastName: '', email: '', phone: '' })
    const [billingData, setBillingData] = useState<any>({})

    // Payment State
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [isGeneratingPayment, setIsGeneratingPayment] = useState(false)

    useEffect(() => {
        const stored = sessionStorage.getItem("cart_booking")
        if (!stored) {
            // If no cart data, redirect to home or back?
            // alert("Carrello vuoto")
            // router.push("/")
        } else {
            try {
                setCartData(JSON.parse(stored))
            } catch (e) {
                console.error("Invalid cart data")
            }
        }
    }, [])

    const handleGeneratePayment = async () => {
        if (!cartData) return
        setIsGeneratingPayment(true)

        try {
            const payload = {
                tourId: cartData.tour.id,
                tourType: cartData.tour.type,
                quantity: cartData.quantity,
                embedded: true,
                guestData: {
                    ...accountData,
                    passengers: cartData.passengers,
                    billing: billingData // We can store this in metadata or create a separate table later
                }
            }

            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (data.clientSecret) {
                setClientSecret(data.clientSecret)
            } else {
                alert("Errore nella generazione del pagamento: " + (data.error || "Sconosciuto"))
            }

        } catch (err) {
            console.error(err)
            alert("Errore di comunicazione col server")
        } finally {
            setIsGeneratingPayment(false)
        }
    }

    // Auto-trigger payment generation when entering step 3?
    useEffect(() => {
        if (activeAccordionItem === 'item-3' && !clientSecret && !isGeneratingPayment && accountData.email) {
            handleGeneratePayment()
        }
    }, [activeAccordionItem, accountData, clientSecret])

    if (!cartData) return <div className="p-20 text-center">Caricamento carrello...</div>

    const AccordionItems = [
        {
            title: '1. Dati Account e Contatti',
            content: <PersonalDetails
                setActiveAccordionItem={setActiveAccordionItem}
                onDataChange={(d: any) => setAccountData((prev: any) => ({ ...prev, ...d }))}
            />
        },
        {
            title: '2. Dati di Fatturazione',
            content: <ShippingAdress
                setActiveAccordionItem={setActiveAccordionItem}
                onDataChange={(d: any) => setBillingData(d)}
            />
        },
        {
            title: '3. Pagamento',
            content: <PaymentInfo
                clientSecret={clientSecret}
                onPayClick={handleGeneratePayment}
                isLoading={isGeneratingPayment}
            />
        }
    ]

    const subtotal = cartData.total || 0;
    const total = subtotal; // No extra fees for now

    return (
        <section className='bg-slate-50 py-8 sm:py-16 lg:py-24 min-h-screen'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-5'>

                    {/* Order Summary (Left/Top on Mobile) */}
                    <div className='space-y-6 md:col-span-2 lg:col-span-2 order-1 md:order-2'>
                        <Card className='shadow-sm border border-slate-200 bg-white'>
                            <CardContent className='space-y-6 p-6'>
                                <h3 className="text-xl font-bold text-[#323232]">Riepilogo Ordine</h3>
                                <div className="flex gap-4">
                                    <img src={cartData.tour.image} className="w-20 h-20 object-cover rounded-lg" />
                                    <div>
                                        <p className="font-bold text-sm text-[#323232]">{cartData.tour.title}</p>
                                        <p className="text-xs text-slate-500">{cartData.quantity} Passeggeri</p>
                                        {cartData.selectedStop && <p className="text-xs text-[#004BA5] font-medium">{cartData.selectedStop}</p>}
                                    </div>
                                </div>

                                <Separator />

                                <div className='space-y-3.5'>
                                    <div className='flex items-center justify-between gap-3'>
                                        <span className='text-sm text-slate-700'>Subtotale</span>
                                        <span className='font-bold text-[#323232]'>€{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className='flex items-center justify-between gap-3'>
                                        <span className='text-sm text-slate-700'>Tasse e Fee</span>
                                        <span className='font-bold text-[#323232]'>€0.00</span>
                                    </div>
                                </div>

                                <Separator />

                                <div className='flex items-center justify-between gap-3'>
                                    <span className='text-lg font-bold text-[#323232]'>Totale</span>
                                    <span className='text-3xl font-black text-[#004BA5]'>€{total.toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="text-xs text-slate-400 text-center">
                            Completando l'acquisto accetti i nostri Termini e Condizioni.
                        </div>
                    </div>

                    {/* Accordion Forms (Right/Main) */}
                    <div className='md:col-span-2 lg:col-span-3 order-2 md:order-1'>
                        <Card className='shadow-sm border-0 bg-transparent'>
                            <CardContent className="p-0">
                                <Accordion type='single' collapsible className='w-full space-y-4' value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
                                    {AccordionItems.map((item, index) => (
                                        <AccordionItem key={index} value={`item-${index + 1}`} className='rounded-xl border border-slate-200 bg-white shadow-sm px-2'>
                                            <AccordionTrigger className='px-4 hover:no-underline hover:bg-slate-50 rounded-lg py-4'>
                                                <span className="font-bold text-lg text-[#323232]">{item.title}</span>
                                            </AccordionTrigger>
                                            <AccordionContent className='px-4 pt-4 pb-6 border-t border-slate-100'>
                                                {item.content}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Checkout
