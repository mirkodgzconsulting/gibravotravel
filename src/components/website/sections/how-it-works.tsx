"use client"

import Image from "next/image"

const features = [
    {
        badge: "CHI?",
        title: "Una community",
        description: "Conosci nuovi amici viaggiando in piccoli gruppi con persone come te (sempre accompagnati da un Coordinatore!) ed entra a far parte della community di viaggiatori più grande d'Europa.",
        image: "https://gibravo.it/wp-content/uploads/2025/09/image00014-_1_.webp"
    },
    {
        badge: "COSA?",
        title: "Infiniti viaggi",
        description: "Vivi esperienze uniche in più di 100 paesi nel mondo, scegliendo il mood giusto per te: un evento di qualche ora, un weekend fuori porta, un viaggio tematico o un 360° per scoprire luoghi e culture lontani.",
        image: "https://gibravo.it/wp-content/uploads/2025/09/8c73c8e47fd3240ad56828a0acae766f04238d33.webp"
    },
    {
        badge: "COME?",
        title: "Massima flessibilità",
        description: "Puoi bloccare il tuo posto con un acconto e cambiare idea gratuitamente fino a 31 giorni dalla partenza, o fino a 8 se aggiungi la Flexible Cancellation. L'assicurazione medico-bagaglio è sempre inclusa, così viaggi senza pensieri.",
        image: "https://gibravo.it/wp-content/uploads/2025/09/BCC-2024-EXPLORER-BUENOS_AIRES-LANDMARKS-HEADER-_MOBILE.webp"
    }
]

export function HowItWorks() {
    return (
        <section className="py-16 bg-white">
            <div className="container px-4 mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div key={index} className="flex flex-col bg-[#F5F8FA] rounded-2xl overflow-hidden h-full">
                            {/* Top Text Section */}
                            <div className="p-8 flex flex-col items-center text-center flex-grow bg-[#E6F0FA] md:bg-[#E6F0FA] lg:first:bg-[#DDEEFF] lg:nth-[2]:bg-[#F6EEE8] lg:last:bg-[#F9F9F8]">
                                {/* Note: Colors approximated from screenshot. 
                   Card 1: Blueish tint
                   Card 2: Beige tint
                   Card 3: White/Gray tint
                */}
                                {/* Correcting bg colors based on index for variety matching screenshot roughly */}
                                <div className={`
                    absolute top-0 left-0 w-full h-1/2 z-0
                    ${index === 0 ? "bg-[#DDEEFF]" : index === 1 ? "bg-[#F6EEE8]" : "bg-[#F9F9F8]"}
                 `} style={{ position: 'relative', background: 'transparent' }}></div>

                                {/* Badge */}
                                <span className="inline-block bg-[#323232] text-white text-xs font-[800] px-3 py-1 rounded-sm mb-6 uppercase tracking-wider z-10">
                                    {feature.badge}
                                </span>

                                <h3 className="text-2xl font-[900] text-[#323232] mb-4 z-10">{feature.title}</h3>

                                <p className="text-[#323232]/80 text-[14px] leading-relaxed z-10">
                                    {feature.description}
                                </p>
                            </div>

                            {/* Bottom Image Section */}
                            <div className="relative h-[250px] w-full mt-auto">
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
