import { currentUser } from '@clerk/nextjs/server'
import Register from '@/components/shadcn-studio/blocks/register-05/register-05'
import LoggedInView from '@/components/shadcn-studio/logged-in-view'
import { Navbar } from '@/components/website/layout/navbar'

const RegisterPage = async () => {
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
            <Register />
        </>
    )
}

export default RegisterPage
