'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Logo from '@/components/shadcn-studio/logo'
import { SignOutButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'

interface LoggedInViewProps {
    firstName?: string | null
}

const LoggedInView = ({ firstName }: LoggedInViewProps) => {
    const router = useRouter()

    return (
        <div className='bg-muted flex h-auto min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24'>
            <Card className='relative w-full max-w-md overflow-hidden border-none pt-12 shadow-lg text-center'>
                <div className='to-primary/10 pointer-events-none absolute top-0 h-52 w-full rounded-t-xl bg-gradient-to-t from-transparent'></div>

                <CardHeader className='justify-center gap-6'>
                    <Logo className='justify-center gap-3' />

                    <div className="flex justify-center my-4">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-10 w-10 text-primary" />
                        </div>
                    </div>

                    <div>
                        <CardTitle className='mb-1.5 text-2xl'>Ciao {firstName || 'Viaggiatore'}!</CardTitle>
                        <CardDescription className='text-base'>Sei già connesso a Gibravo Travel.</CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Button
                        className='w-full'
                        onClick={() => router.push('/area-riservata')}
                    >
                        Vai alla tua Area Riservata
                    </Button>

                    <SignOutButton>
                        <Button variant="outline" className='w-full'>
                            Esci
                        </Button>
                    </SignOutButton>
                </CardContent>
            </Card>
        </div>
    )
}

export default LoggedInView
