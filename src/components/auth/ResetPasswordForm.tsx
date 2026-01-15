'use client'

import React, { useState } from "react";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/shadcn-studio/logo';
import AuthLines from '@/assets/svg/auth-lines';

export default function ResetPasswordForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    setError("");

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.longMessage || "Si è verificato un errore. Verifica l'email inserita.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      } else {
        console.log(result);
        setError("Reset non completato. Riprova.");
      }
    } catch (err: any) {
      console.error(err);
      const errorCode = err.errors?.[0]?.code;
      if (errorCode === 'form_password_pwned') {
        setError("Questa password è risultata compromessa in una violazione di dati esterna. Per la tua sicurezza, scegline una diversa (più complessa).");
      } else {
        setError(err.errors?.[0]?.longMessage || "Codice non valido o errore durante il reset.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='bg-muted flex h-auto min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24'>
      <Card className='relative w-full max-w-md overflow-hidden border-none pt-12 shadow-lg bg-white'>
        <div className='to-primary/10 pointer-events-none absolute top-0 h-52 w-full rounded-t-xl bg-gradient-to-t from-transparent'></div>
        <AuthLines className='pointer-events-none absolute inset-x-0 top-0' />

        <CardHeader className='justify-center gap-6 text-center pt-8'>
          <Logo className='justify-center gap-3' />
          <div>
            <CardTitle className='mb-1.5 text-2xl'>
              {step === 1 ? "Password Dimenticata?" : "Reimposta Password"}
            </CardTitle>
            <CardDescription className='text-base'>
              {step === 1
                ? "Inserisci la tua email per ricevere il codice"
                : "Inserisci codice e nuova password"
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* Error Feedback */}
          {error && (
            <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={step === 1 ? handleSendCode : handleResetPassword} className="space-y-5">
            {step === 1 ? (
              <div key="step-1" className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700">Email</label>
                  <input
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    type="email"
                    id="email"
                    placeholder="nome@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <div key="step-2" className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700">Codice di Verifica</label>
                  <input
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center tracking-widest font-mono text-lg"
                    type="text"
                    id="code"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700">Nuova Password</label>
                  <div className="relative">
                    <input
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 w-full bg-[#FE8008] hover:bg-[#FE8008]/90 text-white shadow-md"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {step === 1 ? "Invia Link di Reset" : "Reimposta Password"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors hover:underline font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Torna al login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
