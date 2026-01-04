import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import Logo from '@/components/shadcn-studio/logo'
import AuthLines from '@/assets/svg/auth-lines'
import RegisterForm from '@/components/shadcn-studio/blocks/register-05/register-form'

const Register = () => {
    return (
        <div className='bg-muted flex h-auto min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24'>
            <Card className='relative w-full max-w-md overflow-hidden border-none pt-12 shadow-lg'>
                <div className='to-primary/10 pointer-events-none absolute top-0 h-52 w-full rounded-t-xl bg-gradient-to-t from-transparent'></div>

                <AuthLines className='pointer-events-none absolute inset-x-0 top-0' />

                <CardHeader className='justify-center gap-6 text-center'>
                    <Logo className='justify-center gap-3' />

                    <div>
                        <CardTitle className='mb-1.5 text-2xl'>Crea un Account</CardTitle>
                        <CardDescription className='text-base'>Inserisci i tuoi dati per registrarti su Gibravo</CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className='mb-6 flex items-center gap-2.5'>
                        <Button variant='outline' className='grow' asChild>
                            <a href='#'>
                                <img
                                    src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/google-icon.png'
                                    alt='google icon'
                                    className='size-5'
                                />
                            </a>
                        </Button>
                        <Button variant='outline' className='grow' asChild>
                            <a href='#'>
                                <img
                                    src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/facebook-icon.png'
                                    alt='facebook icon'
                                    className='size-5'
                                />
                            </a>
                        </Button>
                        {/* Removed Github */}
                    </div>

                    <div className='mb-6 flex items-center gap-4'>
                        <Separator className='flex-1' />
                        <p>o</p>
                        <Separator className='flex-1' />
                    </div>

                    <RegisterForm />

                    <p className='text-muted-foreground mt-4 text-center'>
                        Hai già un account?{' '}
                        <a href='/login' className='text-card-foreground hover:underline'>
                            Accedi
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

export default Register
