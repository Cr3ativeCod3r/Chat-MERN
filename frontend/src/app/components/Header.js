"use client"
import { observer } from 'mobx-react-lite';
import { authStore } from '../store/authStore';
import { useRouter } from 'next/navigation';
import { IoIosChatbubbles } from "react-icons/io";
import { IoMdLogOut } from "react-icons/io";
import { CgProfile } from "react-icons/cg";

export const Header = observer(() => {
  const router = useRouter();

  const handleLogout = () => {
    authStore.logout();
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    router.push('/');
  };

  return (
    <header className="bg-gray-800 text-white py-4 animate-fade-in">
      <div className="container mx-auto  flex justify-between items-center">
        <div
          className="text-xl font-bold cursor-pointer flex items-center transition-transform duration-200 hover:scale-105"
          onClick={() => router.push('/dashboard')}
        >
          Chat App <IoIosChatbubbles className='ml-2' />
        </div>

        <nav>
          <ul className="flex space-x-4 items-center">
            {!authStore.isAuthenticated ? (
              <>
                <li>
                  <button
                    onClick={() => router.push('/')}
                    className="text-white hover:text-blue-300 transition-colors duration-200 cursor-pointer"
                  >
                    Logowanie
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/register')}
                    className="text-white hover:text-blue-300 transition-colors duration cursor-pointer"
                  >
                    Rejestracja
                  </button>
                </li>
              </>
            ) : (
              <>


                <li>
                  <button
                    onClick={() => router.push('/profile')}
                    className="text-white hover:text-red-300 flex items-center cursor-pointer transition-colors duration-200"
                  >
                    {authStore.user?.nick}  <CgProfile className='ml-2 text-xl' />
                  </button>
                </li>

                <li>
                  <button
                    onClick={handleLogout}
                    className="text-white hover:text-red-300 flex items-center cursor-pointer transition-colors duration-200"
                  >

                    <IoMdLogOut className='ml-2 text-xl' />
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>

    </header>
  );
});