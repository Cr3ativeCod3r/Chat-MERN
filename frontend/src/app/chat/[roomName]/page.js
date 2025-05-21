"use client"; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { observer } from 'mobx-react';
import { authStore } from '../../store/authStore';
import { ChatRoom } from '../../components/ChatRoom'; 
import { LoadingSpinner } from '../../components/LoadingSpinner'; 

const ChatPage = observer(() => {
  const router = useRouter();


  useEffect(() => {
    if (!authStore.loading && !authStore.isAuthenticated) {
      router.push('/'); 
    }
  }, [authStore.isAuthenticated, authStore.loading, router]);

  if (authStore.loading) {
    return <LoadingSpinner />;
  }

  if (!authStore.isAuthenticated) {
    return null; 
  }

  return <ChatRoom />;
});

export default ChatPage;