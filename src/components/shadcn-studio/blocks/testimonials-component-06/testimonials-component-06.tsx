"use client"

import React, { useEffect } from "react"

const TestimonialsComponent = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://cdn.trustindex.io/loader.js?d2a2f4c62b0a387c9b36308da82";
        script.async = true;
        document.head.appendChild(script);
    }, []);

    return (
        <section className='py-20 bg-slate-50'>

            <div className='container mx-auto px-4 max-w-7xl'>

                {/* Header Section */}
                <div className='text-center mb-16 space-y-4'>
                    <h2 className='section-title mb-6'>
                        Cosa dicono di noi?
                    </h2>
                    <p className="section-subtitle">
                        Più di 20.000 GIbravotravelers hanno già provato l'esperienza
                    </p>
                </div>

                {/* Contenedor del Widget */}
                <div className="min-h-[300px]">
                    <div className="ti-widget" data-layout-id="d2a2f4c62b0a387c9b36308da82"></div>
                </div>

            </div>
        </section>
    )
}

export default TestimonialsComponent
