'use client'

import { useState } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { EyeIcon, EyeOffIcon, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const RegisterForm = () => {
    const { isLoaded, signUp, setActive } = useSignUp()
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [code, setCode] = useState('')
    const [pendingVerification, setPendingVerification] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const [isPasswordVisible, setIsPasswordVisible] = useState(false)
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
    const [privacyAccepted, setPrivacyAccepted] = useState(false)

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return

        if (!privacyAccepted) {
            setError('Devi accettare la Privacy Policy e i Termini del servizio per continuare.')
            return
        }

        if (password !== confirmPassword) {
            setError('Le password non coincidono.')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            await signUp.create({
                emailAddress: email,
                password,
            })

            // Send the verification email
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

            setPendingVerification(true)
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2))
            setError(err.errors?.[0]?.longMessage || 'Si è verificato un errore durante la registrazione.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return

        setIsLoading(true)
        setError('')

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            })

            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId })
                router.push('/')
            } else {
                console.error(JSON.stringify(completeSignUp, null, 2))
                setError('Verifica fallita. Riprova.')
            }
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2))
            setError(err.errors?.[0]?.longMessage || 'Codice non valido.')
        } finally {
            setIsLoading(false)
        }
    }

    if (pendingVerification) {
        return (
            <form className='space-y-4' onSubmit={handleVerification}>
                <div className='space-y-1'>
                    <Label className='leading-5' htmlFor='code'>
                        Codice di Verifica*
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Abbiamo inviato un codice a {email}
                    </p>
                    <Input
                        id='code'
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder='Inserisci il codice'
                        required
                    />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button className='w-full' type='submit' disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Verifica Email
                </Button>
            </form>
        )
    }

    return (
        <form className='space-y-4' onSubmit={handleSignUp}>
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
                        type={isPasswordVisible ? 'text' : 'password'}
                        placeholder='••••••••••••••••'
                        className='pr-9'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                    <Button
                        type="button"
                        variant='ghost'
                        size='icon'
                        onClick={() => setIsPasswordVisible(prevState => !prevState)}
                        className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
                    >
                        {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                        <span className='sr-only'>{isPasswordVisible ? 'Hide password' : 'Show password'}</span>
                    </Button>
                </div>
            </div>

            {/* Confirm Password */}
            <div className='w-full space-y-1'>
                <Label className='leading-5' htmlFor='confirmPassword'>
                    Conferma Password*
                </Label>
                <div className='relative'>
                    <Input
                        id='confirmPassword'
                        type={isConfirmPasswordVisible ? 'text' : 'password'}
                        placeholder='••••••••••••••••'
                        className='pr-9'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                    <Button
                        type="button"
                        variant='ghost'
                        size='icon'
                        onClick={() => setIsConfirmPasswordVisible(prevState => !prevState)}
                        className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
                    >
                        {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                        <span className='sr-only'>{isConfirmPasswordVisible ? 'Hide password' : 'Show password'}</span>
                    </Button>
                </div>
            </div>

            {/* Privacy policy */}
            <div className='flex items-start gap-3'>
                <Checkbox
                    id='confirmPolicy'
                    className='size-5 mt-0.5'
                    required
                    checked={privacyAccepted}
                    onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                />
                <label htmlFor='confirmPolicy' className='text-sm leading-tight cursor-pointer'>
                    <span className='text-muted-foreground'>Creando un account accetti i </span>
                    <a href='/termini-e-condizioni' target='_blank' rel='noopener noreferrer' className='font-medium hover:underline text-primary'>
                        Termini e Condizioni
                    </a>
                    <span className='text-muted-foreground'> e la </span>
                    <a href='/informativa-privacy' target='_blank' rel='noopener noreferrer' className='font-medium hover:underline text-primary'>
                        Informativa Privacy
                    </a>
                    .
                </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button className='w-full' type='submit' disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Registrati
            </Button>
        </form>
    )
}

export default RegisterForm
