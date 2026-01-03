import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { Mail, Lock, Phone, User as UserIcon } from 'lucide-react'

const PersonalDetails = ({ setActiveAccordionItem, onDataChange }: { setActiveAccordionItem: (value: string) => void, onDataChange: (data: any) => void }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    })

    const handleChange = (field: string, value: string) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onDataChange(newData);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Le password non coincidono");
            return;
        }
        setActiveAccordionItem('item-2');
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-6">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                    <h4 className="font-bold text-[#004BA5] mb-2 flex items-center gap-2">
                        <UserIcon className="h-4 w-4" /> Crea il tuo account
                    </h4>
                    <p className="text-sm text-slate-600">
                        I tuoi dati serviranno per accedere all'Area Riservata e gestire la prenotazione.
                    </p>
                </div>

                <div className='grid grid-cols-1 gap-x-5 gap-y-6 sm:max-md:grid-cols-2 lg:grid-cols-2'>
                    {/* Account Credentials */}
                    <div className='space-y-3.5 sm:max-md:col-span-2 lg:col-span-2'>
                        <Label htmlFor='email' className="text-slate-700 text-[15px]">Email *</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                            <Input
                                type='email'
                                placeholder='tuo@email.com'
                                id='email'
                                required
                                className="pl-10 bg-white text-black border-slate-200 text-[15px]"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className='space-y-3.5'>
                        <Label htmlFor='password' className="text-slate-700 text-[15px]">Password *</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                            <Input
                                type='password'
                                placeholder='••••••••'
                                id='password'
                                required
                                className="pl-10 bg-white text-black border-slate-200 text-[15px]"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className='space-y-3.5'>
                        <Label htmlFor='confirmPassword' className="text-slate-700 text-[15px]">Conferma Password *</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                            <Input
                                type='password'
                                placeholder='••••••••'
                                id='confirmPassword'
                                required
                                className="pl-10 bg-white text-black border-slate-200 text-[15px]"
                                value={formData.confirmPassword}
                                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div className='space-y-3.5'>
                        <Label htmlFor='firstName' className="text-slate-700 text-[15px]">Nome *</Label>
                        <Input
                            type='text'
                            placeholder='Mario'
                            id='firstName'
                            required
                            className="bg-white text-black border-slate-200 text-[15px]"
                            value={formData.firstName}
                            onChange={(e) => handleChange('firstName', e.target.value)}
                        />
                    </div>

                    <div className='space-y-3.5'>
                        <Label htmlFor='lastName' className="text-slate-700 text-[15px]">Cognome *</Label>
                        <Input
                            type='text'
                            placeholder='Rossi'
                            id='lastName'
                            required
                            className="bg-white text-black border-slate-200 text-[15px]"
                            value={formData.lastName}
                            onChange={(e) => handleChange('lastName', e.target.value)}
                        />
                    </div>

                    <div className='space-y-3.5 sm:max-md:col-span-2 lg:col-span-2'>
                        <Label htmlFor='phone' className="text-slate-700 text-[15px]">Telefono Cellulare *</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                            <Input
                                type='tel'
                                placeholder='+39 333 1234567'
                                id='phone'
                                required
                                className="pl-10 bg-white text-black border-slate-200 text-[15px]"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="col-span-full pt-4">
                        <Button type='submit' className="w-full h-12 text-lg text-white bg-[#004BA5] hover:bg-[#003580]">
                            Continua a Fatturazione
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    )
}

export default PersonalDetails
