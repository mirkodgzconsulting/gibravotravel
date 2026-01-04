import { currentUser } from '@clerk/nextjs/server'
import Login from '@/components/shadcn-studio/blocks/login-page-05/login-page-05'
import LoggedInView from '@/components/shadcn-studio/logged-in-view'
import { Navbar } from '@/components/website/layout/navbar'

const LoginPage = async () => {
    const user = await currentUser()

    if (user) {
        return (
            <>
                <Navbar />
                <LoggedInView firstName={user.firstName} />
            </>
        )
    }

    return (
        <>
            {/* Navbar is transparent/absolute by default in some contexts, but we want it visible here. 
                 The Navbar component handles its own scrolling/background logic. 
                 We might need a wrapper if the Navbar expects to be in a specific layout, 
                 but for now straightforward inclusion should work given it has its own container.
                 However, Navbar is designed to overlay content. Let's wrap it if needed. 
                 Looking at layout.tsx, it's just <Navbar />. 
              */}
            <div className="start-0 top-0 w-full z-50 fixed bg-white/80 backdrop-blur-md border-b">
                <Navbar />
            </div>
            {/* Added padding-top to account for fixed navbar */}
            <div className="pt-[58px]">
                <Login />
            </div>
        </>
    )
}

export default LoginPage
