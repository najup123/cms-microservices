export interface RoleModule {
  moduleId: number;
  moduleName?: string;  // Display name (e.g., "Admission Program")
  moduleCode?: string;   // Code for routing (e.g., "ADMISSION")
  functionIds: number[];
}

export interface Role {
  id: number;
  name: string;
  modules?: RoleModule[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  roles: Role[]; // The User entity returns full Role objects
}

export interface Module {
  id: number;
  displayName?: string; // Backend returns displayName
  name?: string; // Frontend uses name for consistency
  code: string;
  description?: string;
}

export const FUNCTION_LIST = [
  { id: 1, name: 'SELECT' },
  { id: 2, name: 'UPDATE' },
  { id: 3, name: 'CREATE' },
  { id: 4, name: 'DELETE' },
];