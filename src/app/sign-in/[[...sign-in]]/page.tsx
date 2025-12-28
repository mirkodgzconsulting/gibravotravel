import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 py-20">
            <SignIn
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "rounded-xl shadow-xl border-none",
                    }
                }}
            />
        </div>
    );
}
