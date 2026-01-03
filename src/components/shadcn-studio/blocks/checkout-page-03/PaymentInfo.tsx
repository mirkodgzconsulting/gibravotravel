import { loadStripe } from '@stripe/stripe-js';
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface PaymentInfoProps {
    clientSecret: string | null;
    onPayClick?: () => void;
    isLoading?: boolean;
}

const PaymentInfo = ({ clientSecret, onPayClick, isLoading }: PaymentInfoProps) => {

    if (!clientSecret) {
        return (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-600 mb-4">
                    Per completare la prenotazione, procedi al pagamento sicuro.
                </p>
                <Button
                    onClick={onPayClick}
                    disabled={isLoading}
                    className="h-12 px-8 text-lg bg-[#004BA5] hover:bg-[#FE8008] shadow-lg shadow-blue-500/20"
                >
                    {isLoading ? <><Loader2 className="animate-spin mr-2" /> Elaborazione...</> : "Genera Modulo di Pagamento"}
                </Button>
            </div>
        )
    }

    return (
        <div className="w-full bg-white rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret }}
            >
                <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
        </div>
    )
}

export default PaymentInfo
