"use client"
import { createClientComponentClient, Session } from "@supabase/auth-helpers-nextjs"
import { SessionContextProvider } from "@supabase/auth-helpers-react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export const Providers = ({ children, initialSession }: { children: React.ReactNode; initialSession?: Session | null }) => {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <SessionContextProvider 
                initialSession={initialSession}  
                supabaseClient={createClientComponentClient()}
            >
                {children}
            </SessionContextProvider>
        </QueryClientProvider>
    )
}
