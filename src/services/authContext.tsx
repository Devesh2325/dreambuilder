import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Organization, UserRole, OrganizationMember, ROLE_PERMISSIONS } from '../types/auth';
import { storage } from './storage';

interface AuthContextType {
  user: UserProfile;
  organization: Organization;
  organizations: Organization[];
  role: UserRole;
  members: OrganizationMember[];
  switchOrganization: (orgId: string) => void;
  createOrganization: (name: string) => void;
  updateProfile: (fullName: string, email: string) => void;
  updateBranding: (branding: Partial<Organization['branding']>) => void;
  inviteMember: (email: string, role: UserRole, fullName: string) => void;
  removeMember: (memberId: string) => void;
  can: (action: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => storage.getCurrentUser());
  const [organization, setOrganization] = useState<Organization>(() => storage.getCurrentOrganization());
  const [organizations, setOrganizations] = useState<Organization[]>(() => storage.getOrganizations());
  const [members, setMembers] = useState<OrganizationMember[]>(() => storage.getMembers(organization?.id));

  // Determine current user's role in the active organization
  const currentMember = members.find(m => m.userId === user.id) || members[0];
  const role: UserRole = currentMember ? currentMember.role : 'owner';

  useEffect(() => {
    setMembers(storage.getMembers(organization.id));
  }, [organization.id]);

  const switchOrganization = (orgId: string) => {
    storage.setCurrentOrganization(orgId);
    const org = storage.getCurrentOrganization();
    setOrganization(org);
    setMembers(storage.getMembers(org.id));
  };

  const createOrganization = (name: string) => {
    const newOrg = storage.createOrganization(name);
    setOrganizations(storage.getOrganizations());
    setOrganization(newOrg);
    setMembers(storage.getMembers(newOrg.id));
  };

  const updateProfile = (fullName: string, email: string) => {
    const updated = { ...user, fullName, email };
    storage.setCurrentUser(updated);
    setUser(updated);
  };

  const updateBranding = (branding: Partial<Organization['branding']>) => {
    const updatedOrg = storage.updateOrganizationBranding(organization.id, branding);
    setOrganization(updatedOrg);
    setOrganizations(storage.getOrganizations());
  };

  const inviteMember = (email: string, memberRole: UserRole, fullName: string) => {
    storage.addMember(email, memberRole, fullName);
    setMembers(storage.getMembers(organization.id));
  };

  const removeMember = (memberId: string) => {
    storage.removeMember(memberId);
    setMembers(storage.getMembers(organization.id));
  };

  const can = (action: string): boolean => {
    const allowed = ROLE_PERMISSIONS[role] || [];
    return allowed.includes(action);
  };

  const logout = () => {
    // In local dev/demo mode, reset or redirect
    console.log('User signed out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        organizations,
        role,
        members,
        switchOrganization,
        createOrganization,
        updateProfile,
        updateBranding,
        inviteMember,
        removeMember,
        can,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
