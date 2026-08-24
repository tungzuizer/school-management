# Quickstart & Validation Guide: Redesign Admin UI

## Verification Commands

1. **Build Test**:
   ```bash
   npx next build
   ```

2. **Anti-Pattern Audit**:
   ```bash
   node .claude/skills/impeccable/scripts/detect.mjs --target src/app/admin
   ```

3. **Login & Dashboard Smoke Test**:
   - Access `https://school-management-red-one.vercel.app/login`
   - Login as `admin@school.com` / `abc123`
   - Verify Admin Dashboard loads with high-contrast UI, working mobile menu, and seamless tab links.
