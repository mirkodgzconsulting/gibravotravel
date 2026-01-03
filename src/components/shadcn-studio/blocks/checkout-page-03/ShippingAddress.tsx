import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { FileText } from 'lucide-react'

const ShippingAdress = ({ setActiveAccordionItem, onDataChange }: { setActiveAccordionItem: (value: string) => void, onDataChange: (data: any) => void }) => {
    const [usePersonalData, setUsePersonalData] = useState(true)
    const [formData, setFormData] = useState({
        address: '',
        city: '',
        zip: '',
        province: '',
        country: 'Italia',
        cf: '',
        piva: '',
        sdi: ''
    })

    const handleChange = (field: string, value: string) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onDataChange({ ...newData, usePersonalData });
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveAccordionItem('item-3');
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className='grid grid-cols-1 gap-x-5 gap-y-6 sm:max-md:grid-cols-2 lg:grid-cols-2'>
                <div className='col-span-full flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200'>
                    <Checkbox
                        id='same-as-billing-address'
                        className='size-5'
                        checked={usePersonalData}
                        onCheckedChange={(c) => {
                            setUsePersonalData(!!c);
                            onDataChange({ ...formData, usePersonalData: !!c });
                        }}
                    />
                    <Label htmlFor='same-as-billing-address' className="cursor-pointer font-medium">
                        Intestare la fattura alla persona indicata nei Dati Personali
                    </Label>
                </div>

                {!usePersonalData && (
                    <div className="col-span-full p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm mb-4">
                        Inserisci qui sotto i dati dell'intestatario della fattura (Azienda o altra persona).
                    </div>
                )}

                <div className='col-span-full space-y-3.5'>
                    <Label htmlFor='address'>Indirizzo e Numero Civico *</Label>
                    <Input
                        value={formData.address} onChange={(e) => handleChange('address', e.target.value)}
                        type='text' placeholder='Via Roma 10' id='address' required
                    />
                </div>

                <div className='space-y-3.5'>
                    <Label htmlFor='city2'>Città *</Label>
                    <Input
                        value={formData.city} onChange={(e) => handleChange('city', e.target.value)}
                        type='text' placeholder='Milano' id='city2' required
                    />
                </div>

                <div className='space-y-3.5'>
                    <Label htmlFor='zipCode'>CAP *</Label>
                    <Input
                        value={formData.zip} onChange={(e) => handleChange('zip', e.target.value)}
                        type='text' placeholder='20100' id='zipCode' required
                    />
                </div>

                <div className='space-y-3.5'>
                    <Label htmlFor='province'>Provincia *</Label>
                    <Input
                        value={formData.province} onChange={(e) => handleChange('province', e.target.value)}
                        type='text' placeholder='MI' id='province' required maxLength={2} className="uppercase"
                    />
                </div>

                <div className='space-y-3.5'>
                    <Label htmlFor='country'>Paese</Label>
                    <Input value={formData.country} readOnly className="bg-slate-100" />
                </div>

                <div className="col-span-full my-4 border-t border-slate-100 pt-4">
                    <h5 className="font-bold flex items-center gap-2 mb-4 text-slate-700">
                        <FileText className="h-4 w-4" /> Dati Fiscali
                    </h5>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className="space-y-2">
                            <Label>Codice Fiscale *</Label>
                            <Input
                                value={formData.cf} onChange={(e) => handleChange('cf', e.target.value)}
                                placeholder="RSSMRA..." required className="uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Partita IVA (Opzionale)</Label>
                            <Input
                                value={formData.piva} onChange={(e) => handleChange('piva', e.target.value)}
                                placeholder="Solo se azienda"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Codice SDI / PEC (Opzionale)</Label>
                            <Input
                                value={formData.sdi} onChange={(e) => handleChange('sdi', e.target.value)}
                                placeholder="XXXXXXX"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className='mt-6'>
                <Button type='submit' className="w-full h-12 text-lg bg-[#004BA5] hover:bg-[#003580]">
                    Vai al Pagamento
                </Button>
            </div>
        </form>
    )
}

export default ShippingAdress
