'use client'

import { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { EyeIcon, EyeOffIcon, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const LoginForm = () => {
    const { isLoaded, signIn, setActive } = useSignIn()
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isVisible, setIsVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isLoaded) return
        setIsLoading(true)
        setError('')

        try {
            const result = await signIn.create({
                identifier: email,
                password,
            })

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId })
                router.push('/') // Redirect to home or dashboard
            } else {
                // Handle other statuses (e.g. MFA)
                console.log(result)
                setError('Login incompleto. Contatta il supporto.')
            }
        } catch (err: any) {
            console.error(err)
            setError(err.errors?.[0]?.longMessage || 'Credenziali non valide.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form className='space-y-4' onSubmit={handleSubmit}>
            {/* Email */}
            <div className='space-y-1'>
                <Label className='leading-5' htmlFor='userEmail'>
                    Email*
                </Label>
                <Input
                    type='email'
                    id='userEmail'
                    placeholder='Inserisci la tua email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            {/* Password */}
            <div className='w-full space-y-1'>
                <Label className='leading-5' htmlFor='password'>
                    Password*
                </Label>
                <div className='relative'>
                    <Input
                        id='password'
                        type={isVisible ? 'text' : 'password'}
                        placeholder='••••••••••••••••'
                        className='pr-9'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button
                        variant='ghost'
                        size='icon'
                        type="button"
                        onClick={() => setIsVisible(prevState => !prevState)}
                        className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
                    >
                        {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                        <span className='sr-only'>{isVisible ? 'Nascondi password' : 'Mostra password'}</span>
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
            )}

            {/* Remember Me and Forgot Password */}
            <div className='flex items-center justify-between gap-y-2'>
                <div className='flex items-center gap-3'>
                    <Checkbox id='rememberMe' className='size-6' />
                    <Label htmlFor='rememberMe' className='text-muted-foreground'>
                        {' '}
                        Ricordami
                    </Label>
                </div>

                <a href='/reset-password' className='hover:underline text-sm'>
                    Password dimenticata?
                </a>
            </div>

            <Button className='w-full' type='submit' disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Accedi
            </Button>
        </form>
    )
}

export default LoginForm
