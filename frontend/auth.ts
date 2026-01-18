
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            authorization: {
                params: {
                    prompt: "consent select_account",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        authorized: async ({ auth }) => {
            return !!auth
        },
        async jwt({ token, account }) {
            if (account) {
                console.log("JWT Callback: Got account", account.provider)
                token.id_token = account.id_token
            }
            return token
        },
        async session({ session, token }) {
            // @ts-ignore
            if (token.id_token) {
                // @ts-ignore
                session.id_token = token.id_token
            } else {
                console.log("Session Callback: No id_token in token")
            }
            return session
        }
    },
    pages: {
        signIn: '/', // Redirect to home for sign in
    }
})
