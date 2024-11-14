"use client"
import { createClientComponentClient, Session } from "@supabase/auth-helpers-nextjs"
import { SessionContextProvider } from "@supabase/auth-helpers-react"

export const Providers = ({ children, initialSession }: { children: React.ReactNode; initialSession?: Session | null
 }) => {
    return  <SessionContextProvider initialSession={initialSession}  supabaseClient={createClientComponentClient()}>{children}</SessionContextProvider>;
};