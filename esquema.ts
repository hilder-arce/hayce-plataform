/*
SISTEMA RBAC + ABAC

FALTA: IMPLEMENTAR LOS CAMPOS DE AUDITORIA
createdBy
updatedBy
deletedBy

// AUDIT LOG: FALTA INTEGRAR
auditLog {
  entity
  action
  userId
  timestamp
  ETC
}

//PROBLEMAS

PROBLEMA 1
rol embebido en usuario (mala escalabilidad)
"rol": ObjectId //ESTO ES LIMITADO

PROBLEMA 02
permisos como ObjectId (falta semántica)
"permisos": ["69a7312f...", ...]
DEBERÍA SER 
{
  "code": "worker:create",
  "modulo": "worker"
}

PROBLEMA 03
estacion como string en tareo (falta referencia a entidad)
"estacion": "COMPONENTES"

PROBLEMA 04
falta índice único multi-tenant PUEDE DUPKLI
"numero_operacion": "OP-001"
DEBE SER
{ numero_operacion: 1, organization: 1 } unique

ADD
ORGANIZATION USER (nuevo)
{
  "user": "...",
  "organization": "...",
  "roles": ["roleId1", "roleId2"]
  ETC
}

ROLE (correcto pero mejorar)
{
  "nombre": "Manager",
  "organization": "...",
  "permissions": ["worker:create", "worker:read"]
  ETC
}

FALTA
Validación crítica 
Cuando asignas permisos a un rol:
if (!currentUser.permissions.includes(permission)) {
  throw new ForbiddenException();
}

Middleware multi-tenant

TODAS las queries deben filtrar:

{ organization: user.orgId }

Middleware multi-tenant

TODAS las queries deben filtrar:

{ organization: user.orgId }

Nivel PRO (lo que te falta para ser enterprise real)

Te faltan 3 cosas clave:

🚀 1. Permission caching (Redis)
No consultar DB en cada request
Cachear permisos del usuario
🚀 2. Policy-based access (tipo ABAC)

Ejemplo:

Solo editar tareos creados por él
Solo ver trabajadores de su estación
🚀 3. Soft delete real

Ya tienes estado, pero falta:

"deletedAt": Date
"deletedBy": ObjectIdX
*/