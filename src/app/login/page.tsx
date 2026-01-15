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
            <Login />
        </>
    )
}

export default LoginPage
