'use client';

import useSWR from 'swr';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useUsers() {
  const { data, isLoading } = useSWR<{ data: User[] }>('/api/users', fetcher);
  return { users: data?.data ?? [], loading: isLoading };
}
