import { describe, it, expect } from 'vitest';
import { ROLE_PERMISSIONS, PLAN_LIMITS } from '../types/auth';

describe('Multi-Tenant Permissions Matrix & Plan Entitlements', () => {
  it('enforces strict role-based permissions', () => {
    // Owner permissions
    expect(ROLE_PERMISSIONS.owner).toContain('manage:billing');
    expect(ROLE_PERMISSIONS.owner).toContain('manage:team');
    expect(ROLE_PERMISSIONS.owner).toContain('publish');
    expect(ROLE_PERMISSIONS.owner).toContain('delete:project');

    // Admin permissions
    expect(ROLE_PERMISSIONS.admin).toContain('manage:team');
    expect(ROLE_PERMISSIONS.admin).toContain('publish');
    expect(ROLE_PERMISSIONS.admin).not.toContain('manage:billing');

    // Editor permissions
    expect(ROLE_PERMISSIONS.editor).toContain('edit:project');
    expect(ROLE_PERMISSIONS.editor).toContain('publish');
    expect(ROLE_PERMISSIONS.editor).not.toContain('manage:team');
    expect(ROLE_PERMISSIONS.editor).not.toContain('delete:project');

    // Viewer permissions
    expect(ROLE_PERMISSIONS.viewer).toContain('view:project');
    expect(ROLE_PERMISSIONS.viewer).not.toContain('edit:project');
    expect(ROLE_PERMISSIONS.viewer).not.toContain('publish');
  });

  it('provides graduated plan entitlements', () => {
    expect(PLAN_LIMITS.free.maxProjects).toBe(3);
    expect(PLAN_LIMITS.free.customDomainEnabled).toBe(false);

    expect(PLAN_LIMITS.starter.maxProjects).toBe(15);
    expect(PLAN_LIMITS.starter.removeBranding).toBe(true);

    expect(PLAN_LIMITS.pro.maxProjects).toBe(100);
    expect(PLAN_LIMITS.pro.customDomainEnabled).toBe(true);
    expect(PLAN_LIMITS.pro.aiGenerationsPerMonth).toBe(1000);

    expect(PLAN_LIMITS.enterprise.maxProjects).toBeGreaterThan(1000);
  });
});
