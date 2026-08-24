# Data Model & State Contracts: Redesign Admin UI

## User Session Schema (NextAuth JWT)

```typescript
interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: "SUPER_ADMIN" | "DEPARTMENT_ADMIN" | "WARD_ADMIN" | "ADMIN" | "VICE_PRINCIPAL" | "TEACHER" | "STUDENT";
    isApproved?: boolean;
    mustChangePassword?: boolean;
    schoolId?: string;
    campusId?: string;
    departmentId?: string;
    districtWardId?: string;
  };
}
```

## Admin Profile DTO

```typescript
interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  isApproved: boolean;
  schoolName: string;
  districtWardName: string;
  departmentName: string;
}
```
