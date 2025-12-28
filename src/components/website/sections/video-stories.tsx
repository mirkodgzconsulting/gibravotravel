"use client"

import Image from "next/image"
import { Play } from "lucide-react"

const stories = [
    {
        title: "Ci tuffiamo nei cenote",
        location: "Messico",
        image: "https://images.unsplash.com/photo-1682685797828-d3b25245891f?q=80&w=2070&auto=format&fit=crop" // Cenote/Water
    },
    {
        title: "Facciamo trekking a 5.000 metri!",
        location: "Valle Rojo, Perù",
        image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=2070&auto=format&fit=crop" // Trekking
    },
    {
        title: "Facciamo snorkeling nel blu!",
        location: "Isole Gili, Indonesia",
        image: "https://images.unsplash.com/photo-1544551763-46a42cbedbfc?q=80&w=2069&auto=format&fit=crop" // Snorkeling
    }
]

export function VideoStories() {
    return (
        <section className="py-16 bg-[#111111] text-white">
            <div className="container px-4 mx-auto max-w-7xl">
                <h2 className="text-3xl font-[900] tracking-tight text-center mb-12">
                    Cosa succede durante un viaggio WeRoad?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stories.map((story, index) => (
                        <div key={index} className="relative aspect-[9/16] w-full overflow-hidden rounded-xl group cursor-pointer">
                            <Image
                                src={story.image}
                                alt={story.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                                    <Play className="fill-white text-white h-8 w-8 ml-1" />
                                </div>
                            </div>

                            <div className="absolute bottom-6 left-6 right-6">
                                <h3 className="text-xl font-[800] mb-2 leading-tight">{story.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-white/70 font-medium">
                                    <span className="bg-white/20 p-0.5 rounded-full px-2 text-[10px] uppercase tracking-wide">
                                        {story.location}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
