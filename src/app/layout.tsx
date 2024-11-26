import "./globals.css"
import NavBar from '@/components/NavBar';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Inter, Poppins } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import { Providers } from './providers';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-poppins' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Splitter - Split Expenses with Friends',
  description: 'Split expenses with friends easily',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body className={`${poppins.variable} ${inter.variable}`}>
        <Providers initialSession={session}>
          <div className="min-h-screen bg-gray-50">
            <NavBar user={session?.user || null} />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
