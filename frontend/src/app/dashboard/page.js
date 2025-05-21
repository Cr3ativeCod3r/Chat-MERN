'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { observer } from 'mobx-react';
import { authStore } from '../store/authStore';
import { Dashboard } from '../components/Dashboard';
import { LoadingSpinner } from '../components/LoadingSpinner';

const DashboardPage = observer(() => {
  const router = useRouter();

  useEffect(() => {
    if (!authStore.loading && !authStore.isAuthenticated) {
      router.push('/');
    }
  }, [authStore.isAuthenticated, authStore.loading]);

  if (authStore.loading) {
    return <LoadingSpinner />;
  }

  return authStore.isAuthenticated ? <Dashboard /> : null;
});

export default DashboardPage;