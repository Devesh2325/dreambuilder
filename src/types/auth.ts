export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
}

export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'agency' | 'enterprise';

export interface OrganizationBranding {
  primaryColor: string;
  logoUrl?: string;
  companyName: string;
  brandType?: string;
  fontFamily?: string;
  baseFontSize?: number;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  darkThemeEnabled?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: SubscriptionPlan;
  branding: OrganizationBranding;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  user: UserProfile;
  role: UserRole;
  createdAt: string;
}

export interface PlanLimits {
  maxProjects: number;
  maxMonthlyImpressions: number;
  aiGenerationsPerMonth: number;
  customDomainEnabled: boolean;
  removeBranding: boolean;
  teamMembersLimit: number;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxProjects: 3,
    maxMonthlyImpressions: 1000,
    aiGenerationsPerMonth: 10,
    customDomainEnabled: false,
    removeBranding: false,
    teamMembersLimit: 1,
  },
  starter: {
    maxProjects: 15,
    maxMonthlyImpressions: 25000,
    aiGenerationsPerMonth: 100,
    customDomainEnabled: false,
    removeBranding: true,
    teamMembersLimit: 3,
  },
  pro: {
    maxProjects: 100,
    maxMonthlyImpressions: 250000,
    aiGenerationsPerMonth: 1000,
    customDomainEnabled: true,
    removeBranding: true,
    teamMembersLimit: 10,
  },
  agency: {
    maxProjects: 500,
    maxMonthlyImpressions: 1000000,
    aiGenerationsPerMonth: 5000,
    customDomainEnabled: true,
    removeBranding: true,
    teamMembersLimit: 30,
  },
  enterprise: {
    maxProjects: 99999,
    maxMonthlyImpressions: 10000000,
    aiGenerationsPerMonth: 50000,
    customDomainEnabled: true,
    removeBranding: true,
    teamMembersLimit: 999,
  },
};

// Permission matrix:
// Actions: 'create:project', 'edit:project', 'delete:project', 'publish', 'manage:billing', 'manage:team', 'manage:integrations'
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: [
    'create:project',
    'edit:project',
    'delete:project',
    'publish',
    'manage:billing',
    'manage:team',
    'manage:integrations',
    'manage:settings',
  ],
  admin: [
    'create:project',
    'edit:project',
    'delete:project',
    'publish',
    'manage:team',
    'manage:integrations',
  ],
  editor: [
    'create:project',
    'edit:project',
    'publish',
  ],
  viewer: [
    'view:project',
  ],
};
