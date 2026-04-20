import { User, Role, Module } from '@/types';

// Mock data for testing when backend is not reachable
export const mockUser: User = {
  id: 1,
  username: 'admin',
  email: 'admin@system.io',
  roles: [
    { id: 1, name: 'ROLE_SUPER_ADMIN' }
  ]
};

export const mockUsers: User[] = [
  mockUser,
  {
    id: 2,
    username: 'manager',
    email: 'manager@system.io',
    roles: [{ id: 2, name: 'ROLE_ADMIN' }]
  },
  {
    id: 3,
    username: 'user1',
    email: 'user1@system.io',
    roles: [{ id: 3, name: 'ROLE_USER' }]
  },
];

export const mockRoles: Role[] = [
  { 
    id: 1, 
    name: 'ROLE_SUPER_ADMIN',
    modules: [
      { moduleId: 1, functionIds: [1, 2, 3, 4] },
      { moduleId: 2, functionIds: [1, 2, 3, 4] },
    ]
  },
  { 
    id: 2, 
    name: 'ROLE_ADMIN',
    modules: [
      { moduleId: 1, functionIds: [1, 2, 3] },
      { moduleId: 2, functionIds: [1, 2] },
    ]
  },
  { 
    id: 3, 
    name: 'ROLE_USER',
    modules: [
      { moduleId: 1, functionIds: [1] },
    ]
  },
];

export const mockModules: Module[] = [
  { id: 1, displayName: 'User Management', code: 'USER_MANAGEMENT', description: 'Manage system users' },
  { id: 2, displayName: 'Settings', code: 'SETTINGS', description: 'System configuration' },
];

export const mockToken = 'mock-jwt-token-for-testing';

// Helper to check if we should use mock data
export const useMockData = () => {
  // You can toggle this for development
  return false;
};
