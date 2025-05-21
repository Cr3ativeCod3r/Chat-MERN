const ProtectedRoute = observer(({ children }) => {
  const router = useRouter();
  useEffect(() => {
    if (!authStore.loading && !authStore.isAuthenticated) {
      router.push('/');
    }
  }, [authStore.isAuthenticated, authStore.loading]);

  if (authStore.loading) {
    return <LoadingSpinner />;
  }
  return authStore.isAuthenticated ? children : null;
});
