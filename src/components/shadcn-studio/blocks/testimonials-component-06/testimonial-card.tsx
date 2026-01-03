import { Avatar, AvatarFallback, AvatarImage } from '@/components/website/ui/avatar'
import { Card, CardContent } from '@/components/website/ui/card'

type Testimonial = {
    name: string
    role: string
    avatar: string
    content: string
}

import { Quote } from 'lucide-react'

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => {
    return (
        <Card className='bg-slate-50 max-w-sm border-none shadow-md'>
            <CardContent className='space-y-4 p-4'>
                <div>
                    <Quote className='text-[#FE8008] w-10 h-10 mb-4 fill-[#FE8008]/10' />
                    <p className='text-slate-600 line-clamp-4 font-regular leading-relaxed'>{testimonial.content}</p>
                </div>
                <div className='flex items-center gap-3 mt-4'>
                    <div>
                        <h4 className='font-semibold text-[#323232]'>{testimonial.name}</h4>
                        <p className='text-slate-500 text-sm'>{testimonial.role}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default TestimonialCard
