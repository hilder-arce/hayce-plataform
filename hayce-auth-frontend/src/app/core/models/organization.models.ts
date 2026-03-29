export interface OrganizationItem {
  _id: string;
  nombre: string;
  slug: string;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
  userCount?: number;
  roleCount?: number;
  createdBy?: {
    _id: string;
    nombre: string;
    email?: string;
  } | null;
  principalAdmin?: {
    _id: string;
    nombre: string;
    email?: string;
  } | null;
}

export interface OrganizationFormData {
  nombre: string;
  slug: string;
}
