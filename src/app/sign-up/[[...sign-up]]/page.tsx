import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 py-20">
            <SignUp
                appearance={{
                    elements: {
                        // Hide Social Buttons (CSS Trick) or use layout if possible. 
                        // Clerk doesn't explicitly allow hiding social via props if they are enabled in dashboard,
                        // BUT we can style them.
                        // However, the best way for the user is to DISABLE them in dashboard.
                        // Here we just provide a clean container.
                        rootBox: "mx-auto",
                        card: "rounded-xl shadow-xl border-none",
                    }
                }}
            />
        </div>
    );
}
