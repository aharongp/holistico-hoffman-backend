export const PERMISSION_RESOURCES = [
  'instruments',
  'patients',
  'programs',
  'users',
] as const;

export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'update',
  'delete',
  'assign',
] as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
export type PermissionKey = `${PermissionResource}.${PermissionAction}`;

export const PERMISSION_SCOPE_MENU = '__permissions__';
export const PERMISSION_SCOPE_OPTION = 'custom';

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_RESOURCES.flatMap(
  (resource) => PERMISSION_ACTIONS.map((action) => `${resource}.${action}` as PermissionKey),
);

const RESOURCE_LABELS: Record<PermissionResource, string> = {
  instruments: 'Instrumentos',
  patients: 'Pacientes',
  programs: 'Programas',
  users: 'Usuarios',
};

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'Ver',
  create: 'Crear',
  update: 'Editar',
  delete: 'Eliminar',
  assign: 'Asignar',
};

export const PERMISSION_CATALOG = PERMISSION_RESOURCES.map((resource) => ({
  resource,
  label: RESOURCE_LABELS[resource],
  actions: PERMISSION_ACTIONS.map((action) => ({
    action,
    label: ACTION_LABELS[action],
    key: `${resource}.${action}` as PermissionKey,
  })),
}));

export const DOCTOR_COACH_ROLES = new Set(['doctor', 'coach']);

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<string, PermissionKey[]> = {
  administrator: ALL_PERMISSION_KEYS,
  trainer: ALL_PERMISSION_KEYS.filter((key) => !key.startsWith('users.')),
  therapist: ALL_PERMISSION_KEYS.filter((key) => !key.startsWith('users.')),
  doctor: ALL_PERMISSION_KEYS.filter((key) => !key.startsWith('users.')),
  coach: ALL_PERMISSION_KEYS.filter((key) => !key.startsWith('users.')),
  patient: [],
  student: [],
};

export const normalizeRole = (role: string | null | undefined): string => {
  const value = (role ?? '').toString().trim().toLowerCase();

  if (['administrator', 'admin', 'administrador'].includes(value)) {
    return 'administrator';
  }

  if (['trainer', 'entrenador'].includes(value)) {
    return 'trainer';
  }

  if (['therapist', 'terapeuta'].includes(value)) {
    return 'therapist';
  }

  if (['doctor', 'medico', 'médico'].includes(value)) {
    return 'doctor';
  }

  if (value === 'coach') {
    return 'coach';
  }

  if (['student', 'estudiante'].includes(value)) {
    return 'student';
  }

  if (['patient', 'paciente', 'usuario', 'user', 'usuarios'].includes(value)) {
    return 'patient';
  }

  return value || 'patient';
};

export const isAdminRole = (role: string | null | undefined): boolean =>
  normalizeRole(role) === 'administrator';

export const isPermissionKey = (value: string): value is PermissionKey => {
  return ALL_PERMISSION_KEYS.includes(value as PermissionKey);
};

export const parsePermissionKey = (
  key: string,
): { resource: PermissionResource; action: PermissionAction } | null => {
  const [resource, action] = key.split('.');

  if (
    !resource
    || !action
    || !PERMISSION_RESOURCES.includes(resource as PermissionResource)
    || !PERMISSION_ACTIONS.includes(action as PermissionAction)
  ) {
    return null;
  }

  return {
    resource: resource as PermissionResource,
    action: action as PermissionAction,
  };
};
