import './globals.css';
import { Header } from './components/Header'
export const metadata = {
  title: 'Auth System',
  description: 'System logowania i rejestracji',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body >
        <div className='min-h-screen'>
          <Header />
          <main className=" flex items-center justify-center h-[92vh] overflow-y-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}