'use client';

import { Table } from '@/components/ui/Table';
import { useUsers } from './useUsers';

export function UserList() {
  const { users, loading } = useUsers();

  if (loading) return <p>Loading users...</p>;

  return (
    <Table
      data={users}
      keyExtractor={(u) => u.id}
      columns={[
        { key: 'name', header: 'Name', render: (u) => u.name },
        { key: 'email', header: 'Email', render: (u) => u.email },
        { key: 'role', header: 'Role', render: (u) => u.role },
      ]}
    />
  );
}
