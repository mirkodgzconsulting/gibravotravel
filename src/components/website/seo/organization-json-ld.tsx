/** Schema.org TravelAgency — tutte le pagine del sito marketing */
export function OrganizationJsonLd() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TravelAgency",
        name: "GiBravo Travel",
        alternateName: "GiBravo",
        url: "https://www.gibravo.it",
        logo: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767486148/Cover-Share-Logo-GiBravoTravel_dwbar6.webp",
        image:
            "https://res.cloudinary.com/dskliu1ig/image/upload/v1767486148/Cover-Share-Logo-GiBravoTravel_dwbar6.webp",
        telephone: "+390282197645",
        email: "info@gibravo.it",
        address: {
            "@type": "PostalAddress",
            streetAddress: "Via Bartolomeo Eustachi, 30",
            addressLocality: "Milano",
            postalCode: "20129",
            addressRegion: "MI",
            addressCountry: "IT",
        },
        geo: {
            "@type": "GeoCoordinates",
            latitude: 45.4781,
            longitude: 9.2189,
        },
        areaServed: {
            "@type": "City",
            name: "Milano",
        },
        priceRange: "€€",
        sameAs: [
            "https://www.instagram.com/gibravo.travel",
            "https://www.facebook.com/GiBravoTravelAgenzia",
            "https://www.tiktok.com/@gibravotravel",
        ],
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    )
}
