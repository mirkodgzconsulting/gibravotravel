'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import Logo from '@/components/shadcn-studio/logo'
import AuthLines from '@/assets/svg/auth-lines'
import LoginForm from '@/components/shadcn-studio/blocks/login-page-05/login-form'
import { useSignIn } from '@clerk/nextjs'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

const Login = () => {
    const { isLoaded, signIn } = useSignIn()
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState('')

    const handleGoogleLogin = async () => {
        if (!isLoaded) {
            return
        }
        setIsGoogleLoading(true)
        setError('')

        try {
            const origin = window.location.origin
            await signIn.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl: `${origin}/sso-callback`,
                redirectUrlComplete: `${origin}/`,
            })
        } catch (err: any) {
            console.error('Google login error:', err)
            setIsGoogleLoading(false)
            if (err.errors?.[0]?.code === 'too_many_requests') {
                setError('Troppe richieste. Attendi un minuto e riprova.')
            } else if (err.errors?.[0]?.code === 'strategy_not_enabled') {
                setError('Login con Google non abilitato. Contatta l\'amministratore.')
            } else {
                setError('Si è verificato un errore durante il login con Google.')
            }
        }
    }

    return (
        <div className='bg-muted flex h-screen w-full items-center justify-center overflow-y-auto px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24'>
            <Card className='relative w-full max-w-md overflow-hidden border-none pt-12 shadow-lg'>
                <div className='to-primary/10 pointer-events-none absolute top-0 h-52 w-full rounded-t-xl bg-gradient-to-t from-transparent'></div>

                <AuthLines className='pointer-events-none absolute inset-x-0 top-0' />

                <CardHeader className='justify-center gap-6 text-center'>
                    <Logo className='justify-center gap-3' />

                    <div>
                        <CardTitle className='mb-1.5 text-2xl'>Bentornato</CardTitle>
                        <CardDescription className='text-base'>Inserisci i tuoi dati per accedere</CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className='mb-6 flex flex-col gap-4'>
                        <Button
                            variant='outline'
                            className='w-full gap-2'
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading}
                            type="button"
                        >
                            <span className="flex items-center justify-center w-5 h-5">
                                {isGoogleLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <img
                                        src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/google-icon.png'
                                        alt='google icon'
                                        className='size-5'
                                    />
                                )}
                            </span>
                            Accedi con Google
                        </Button>
                        {error && (
                            <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                        )}
                    </div>

                    <div className='mb-6 flex items-center gap-4'>
                        <Separator className='flex-1' />
                        <p>o</p>
                        <Separator className='flex-1' />
                    </div>

                    <LoginForm />

                    <p className='text-muted-foreground mt-4 text-center'>
                        Nuovo su Gibravo?{' '}
                        <a href='/register' className='text-card-foreground hover:underline'>
                            Crea un account
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

export default Login
