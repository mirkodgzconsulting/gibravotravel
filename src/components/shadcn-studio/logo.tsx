import Image from 'next/image'
import { cn } from '@/lib/utils'

const Logo = ({ className }: { className?: string }) => {
    return (
        <div className={cn('flex items-center justify-center', className)}>
            <Image
                src="/Logo_gibravo.svg"
                alt="Gibravo Travel"
                width={180}
                height={52}
                className="h-12 w-auto"
                priority
            />
        </div>
    )
}

export default Logo
