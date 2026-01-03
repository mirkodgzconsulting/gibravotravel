"use client"

import type { ComponentType } from 'react'
import { ChevronRightIcon } from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type FAQItem = {
    question: string
    answer: string
}

type FAQTab = {
    value: string
    label: string
    icon: ComponentType
    faqs: FAQItem[]
}

const FAQ = ({ tabsData }: { tabsData: FAQTab[] }) => {
    return (
        <section className='py-8 sm:py-16 lg:py-24'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                {/* FAQ Header */}
                <div className='mb-12 space-y-4 md:mb-16 lg:mb-24 text-center lg:text-left'>
                    <div className='text-[#FE8008] text-sm font-bold uppercase tracking-wider font-outfit'>FAQ&apos;s</div>
                    <h2 className='text-3xl font-bold md:text-5xl lg:text-6xl text-[#004BA5] tracking-tight'>
                        Domande <span className='text-[#FE8008]'>Frequenti</span>
                    </h2>
                    <p className='text-slate-600 text-xl max-w-2xl'>
                        Tutto quello che devi sapere per preparare i tuoi bagagli e partire con GiBravo Travel.
                    </p>
                </div>

                <Tabs defaultValue={tabsData[0]?.value || 'general'} orientation='vertical' className="w-full">
                    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
                        {/* Vertical Tabs List */}
                        <TabsList className='h-max w-full flex flex-col gap-3 bg-transparent p-0'>
                            {tabsData.map(tab => {
                                const IconComponent = tab.icon

                                return (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className='data-[state=active]:bg-[#004BA5] data-[state=active]:text-white border border-slate-100 bg-white w-full flex items-center gap-4 rounded-2xl px-6 py-4 text-base font-bold shadow-sm transition-all duration-300 hover:border-blue-200 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200 [&>svg]:size-5'
                                    >
                                        <IconComponent />
                                        <span className='flex-1 text-start'>{tab.label}</span>
                                        <ChevronRightIcon className='size-5 transition-transform duration-300 group-data-[state=active]:rotate-90' />
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>

                        {/* Tab Content */}
                        <div className='lg:col-span-2'>
                            {tabsData.map(tab => (
                                <TabsContent key={tab.value} value={tab.value} className='mt-0 animate-in fade-in duration-500'>
                                    <Accordion type='single' collapsible className='w-full space-y-4 border-none'>
                                        {tab.faqs.map((item, index) => (
                                            <AccordionItem key={index} value={`item-${index + 1}`} className="bg-white rounded-3xl border border-slate-100 px-2 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 mb-4 last:mb-0">
                                                <AccordionTrigger className='px-5 py-6 text-lg md:text-xl font-medium text-slate-800 hover:text-[#004BA5] hover:no-underline [&[data-state=open]]:text-[#004BA5]'>
                                                    {item.question}
                                                </AccordionTrigger>
                                                <AccordionContent className='px-5 pb-6 body-text'>
                                                    <div className="whitespace-pre-line text-slate-600">
                                                        {item.answer}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </TabsContent>
                            ))}
                        </div>
                    </div>
                </Tabs>
            </div>
        </section>
    )
}

export default FAQ
