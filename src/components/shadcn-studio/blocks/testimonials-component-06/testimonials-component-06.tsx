import { Marquee } from '@/components/website/ui/marquee'
import TestimonialCard from '@/components/shadcn-studio/blocks/testimonials-component-06/testimonial-card'

export type TestimonialItem = {
    name: string
    role: string
    avatar: string
    content: string
}

type TestimonialsComponentProps = {
    testimonials: TestimonialItem[]
}

const TestimonialsComponent = ({ testimonials }: TestimonialsComponentProps) => {
    return (
        <section className='space-y-12 py-16 sm:space-y-16 sm:py-20 lg:space-y-20 lg:py-24 bg-white'>
            {/* Section Header */}
            <div className='mx-auto max-w-7xl space-y-4 px-4 text-center sm:px-6 lg:px-8'>

                <h2 className='section-title text-[#004BA5] mb-6'>
                    100% di Valutazioni Positive
                </h2>
                <p className="section-subtitle max-w-lg mx-auto">
                    Oltre 2100 recensioni in 7 anni di viaggi indimenticabili in tutto il mondo.
                </p>
            </div>

            {/* Testimonials Marquee */}
            <div className='relative mt-12'>
                {/* Gradients to fade edges */}
                <div className='from-white pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r to-transparent max-sm:hidden' />
                <div className='from-white pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l to-transparent max-sm:hidden' />

                <div className='w-full overflow-hidden space-y-2'>
                    <Marquee pauseOnHover duration={40} gap={2}>
                        {testimonials.slice(0, 5).map((testimonial, index) => (
                            <TestimonialCard key={index} testimonial={testimonial} />
                        ))}
                    </Marquee>

                    <Marquee pauseOnHover duration={45} gap={2} reverse>
                        {testimonials.slice(5, 10).map((testimonial, index) => (
                            <TestimonialCard key={index} testimonial={testimonial} />
                        ))}
                    </Marquee>
                </div>
            </div>
        </section>
    )
}

export default TestimonialsComponent
