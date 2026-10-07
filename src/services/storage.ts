import { DocumentModel } from '../types/document';
import { Project, Template, Asset, AnalyticsEvent, SurveyResponse, IntegrationConfig, DocumentVersion } from '../types/modules';
import { Organization, UserProfile, OrganizationMember } from '../types/auth';
import { 
  SEED_ORGANIZATION, 
  SEED_USER, 
  SEED_MEMBERS, 
  SEED_PROJECTS, 
  SEED_DOCUMENTS, 
  SEED_TEMPLATES, 
  SEED_ASSETS, 
  SEED_INTEGRATIONS 
} from './seedData';

const STORAGE_KEYS = {
  USER: 'flowpilot_current_user',
  CURRENT_ORG_ID: 'flowpilot_current_org_id',
  ORGS: 'flowpilot_organizations',
  MEMBERS: 'flowpilot_members',
  PROJECTS: 'flowpilot_projects',
  DOCUMENTS: 'flowpilot_documents',
  DOCUMENT_VERSIONS: 'flowpilot_doc_versions',
  TEMPLATES: 'flowpilot_templates',
  ASSETS: 'flowpilot_assets',
  ANALYTICS: 'flowpilot_analytics_events',
  SURVEY_RESPONSES: 'flowpilot_survey_responses',
  CHECKLIST_PROGRESS: 'flowpilot_checklist_progress',
  INTEGRATIONS: 'flowpilot_integrations',
};

class StorageService {
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;
    try {
      if (!localStorage.getItem(STORAGE_KEYS.ORGS)) {
        localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify([SEED_ORGANIZATION]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.CURRENT_ORG_ID)) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_ORG_ID, SEED_ORGANIZATION.id);
      }
      if (!localStorage.getItem(STORAGE_KEYS.USER)) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(SEED_USER));
      }
      if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(SEED_MEMBERS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(SEED_DOCUMENTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
        localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(SEED_TEMPLATES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ASSETS)) {
        localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(SEED_ASSETS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.INTEGRATIONS)) {
        localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(SEED_INTEGRATIONS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.DOCUMENT_VERSIONS)) {
        localStorage.setItem(STORAGE_KEYS.DOCUMENT_VERSIONS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ANALYTICS)) {
        // Seed realistic analytics events for the past 7 days
        const events: AnalyticsEvent[] = [];
        const types: AnalyticsEvent['eventType'][] = ['impression', 'tour_step_completed', 'cta_clicked', 'tour_completed'];
        for (let i = 0; i < 48; i++) {
          const daysAgo = Math.floor(i / 8);
          events.push({
            id: `evt_${i}`,
            organizationId: SEED_ORGANIZATION.id,
            projectId: SEED_PROJECTS[i % SEED_PROJECTS.length].id,
            documentId: SEED_PROJECTS[i % SEED_PROJECTS.length].documentId,
            eventType: types[i % types.length],
            visitorId: `vis_${Math.floor(i / 3)}`,
            sessionId: `sess_${i}`,
            deviceType: i % 4 === 0 ? 'mobile' : 'desktop',
            timestamp: new Date(Date.now() - daysAgo * 86400000 - (i % 8) * 3600000).toISOString(),
          });
        }
        localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(events));
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('StorageService: local storage fallback active', e);
    }
  }

  // Auth & Organizations
  getCurrentUser(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : SEED_USER;
    } catch {
      return SEED_USER;
    }
  }

  setCurrentUser(user: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  getOrganizations(): Organization[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORGS);
      return data ? JSON.parse(data) : [SEED_ORGANIZATION];
    } catch {
      return [SEED_ORGANIZATION];
    }
  }

  getCurrentOrganization(): Organization {
    const orgs = this.getOrganizations();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_ORG_ID);
    return orgs.find(o => o.id === currentId) || orgs[0] || SEED_ORGANIZATION;
  }

  setCurrentOrganization(orgId: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ORG_ID, orgId);
  }

  createOrganization(name: string, plan: Organization['plan'] = 'starter'): Organization {
    const orgs = this.getOrganizations();
    const newOrg: Organization = {
      id: `org_${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      plan,
      branding: {
        primaryColor: '#6366f1',
        companyName: name,
      },
      createdAt: new Date().toISOString(),
    };
    orgs.push(newOrg);
    localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(orgs));
    this.setCurrentOrganization(newOrg.id);
    return newOrg;
  }

  // Members & Team
  getMembers(orgId?: string): OrganizationMember[] {
    const targetOrgId = orgId || this.getCurrentOrganization().id;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      const members: OrganizationMember[] = data ? JSON.parse(data) : SEED_MEMBERS;
      return members.filter(m => m.organizationId === targetOrgId);
    } catch {
      return SEED_MEMBERS;
    }
  }

  addMember(email: string, role: OrganizationMember['role'], fullName: string): OrganizationMember {
    const currentOrg = this.getCurrentOrganization();
    const members: OrganizationMember[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || '[]');
    const newMember: OrganizationMember = {
      id: `mem_${Date.now()}`,
      organizationId: currentOrg.id,
      userId: `usr_${Date.now()}`,
      user: {
        id: `usr_${Date.now()}`,
        email,
        fullName,
        createdAt: new Date().toISOString(),
      },
      role,
      createdAt: new Date().toISOString(),
    };
    members.push(newMember);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    return newMember;
  }

  removeMember(memberId: string) {
    const members: OrganizationMember[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || '[]');
    const filtered = members.filter(m => m.id !== memberId);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(filtered));
  }

  // Projects
  getProjects(orgId?: string): Project[] {
    const targetOrgId = orgId || this.getCurrentOrganization().id;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const all: Project[] = data ? JSON.parse(data) : SEED_PROJECTS;
      return all.filter(p => p.organizationId === targetOrgId);
    } catch {
      return SEED_PROJECTS;
    }
  }

  getProjectById(id: string): Project | undefined {
    const projects = this.getProjects();
    return projects.find(p => p.id === id);
  }

  createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'createdBy'>): Project {
    const org = this.getCurrentOrganization();
    const user = this.getCurrentUser();
    const all: Project[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    
    const newProject: Project = {
      ...data,
      id: `proj_${Date.now()}`,
      organizationId: org.id,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewsCount: 0,
      completionRate: 0,
    };
    all.unshift(newProject);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(all));
    return newProject;
  }

  updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const all: Project[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const index = all.findIndex(p => p.id === id);
    if (index === -1) return undefined;

    all[index] = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(all));
    return all[index];
  }

  deleteProject(id: string): boolean {
    const all: Project[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const filtered = all.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
    return true;
  }

  getDocument(id: string): DocumentModel | undefined {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      const docs: Record<string, DocumentModel> = data ? JSON.parse(data) : SEED_DOCUMENTS;
      if (docs && docs[id]) return docs[id];
      if (SEED_DOCUMENTS[id]) return SEED_DOCUMENTS[id];
      const keys = Object.keys(docs || {});
      if (keys.length > 0) return docs[keys[0]];
      return Object.values(SEED_DOCUMENTS)[0];
    } catch {
      return SEED_DOCUMENTS[id] || Object.values(SEED_DOCUMENTS)[0];
    }
  }

  saveDocument(doc: DocumentModel): DocumentModel {
    const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    const docs: Record<string, DocumentModel> = data ? JSON.parse(data) : {};
    const updated = {
      ...doc,
      updatedAt: new Date().toISOString(),
    };
    docs[doc.id] = updated;
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));

    // Also touch the parent project
    this.updateProject(doc.projectId, { updatedAt: updated.updatedAt });
    return updated;
  }

  publishDocument(id: string, changeSummary: string = 'Published new version'): { document: DocumentModel; version: DocumentVersion } {
    const doc = this.getDocument(id);
    if (!doc) throw new Error('Document not found');

    const versions: DocumentVersion[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENT_VERSIONS) || '[]');
    const docVersions = versions.filter(v => v.documentId === id);
    const nextVersionNumber = docVersions.length + 1;

    const newVersion: DocumentVersion = {
      id: `ver_${Date.now()}`,
      documentId: id,
      projectId: doc.projectId,
      organizationId: doc.organizationId,
      versionNumber: nextVersionNumber,
      documentSnapshot: JSON.parse(JSON.stringify(doc)),
      publishedBy: this.getCurrentUser().fullName,
      changeSummary,
      createdAt: new Date().toISOString(),
    };

    versions.unshift(newVersion);
    localStorage.setItem(STORAGE_KEYS.DOCUMENT_VERSIONS, JSON.stringify(versions));

    const updatedDoc: DocumentModel = {
      ...doc,
      isPublished: true,
      publishedVersionId: newVersion.id,
      updatedAt: new Date().toISOString(),
    };
    this.saveDocument(updatedDoc);
    this.updateProject(doc.projectId, { status: 'published' });

    return { document: updatedDoc, version: newVersion };
  }

  getDocumentVersions(documentId: string): DocumentVersion[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCUMENT_VERSIONS);
      const versions: DocumentVersion[] = data ? JSON.parse(data) : [];
      return versions.filter(v => v.documentId === documentId);
    } catch {
      return [];
    }
  }

  rollbackDocumentVersion(documentId: string, versionId: string): DocumentModel {
    const versions = this.getDocumentVersions(documentId);
    const targetVersion = versions.find(v => v.id === versionId);
    if (!targetVersion) throw new Error('Target version not found');

    const restoredDoc: DocumentModel = {
      ...targetVersion.documentSnapshot,
      updatedAt: new Date().toISOString(),
    };
    return this.saveDocument(restoredDoc);
  }

  // Templates
  getTemplates(): Template[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      return data ? JSON.parse(data) : SEED_TEMPLATES;
    } catch {
      return SEED_TEMPLATES;
    }
  }

  cloneTemplateToProject(templateId: string, customTitle?: string): { project: Project; document: DocumentModel } {
    const templates = this.getTemplates();
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) throw new Error('Template not found');

    const org = this.getCurrentOrganization();
    const user = this.getCurrentUser();
    const newProjectId = `proj_${Date.now()}`;
    const newDocId = `doc_${Date.now()}`;

    // Deep clone document structure
    const clonedDoc: DocumentModel = {
      ...JSON.parse(JSON.stringify(tpl.documentData)),
      id: newDocId,
      projectId: newProjectId,
      organizationId: org.id,
      title: customTitle || `${tpl.title} (Customized)`,
      isPublished: false,
      publishedVersionId: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newProject: Project = {
      id: newProjectId,
      organizationId: org.id,
      title: customTitle || `${tpl.title} (Customized)`,
      description: tpl.description,
      type: tpl.category === 'general' ? 'tour' : tpl.category,
      status: 'draft',
      tags: [...tpl.tags, 'from-template'],
      documentId: newDocId,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewsCount: 0,
      completionRate: 0,
    };

    this.saveDocument(clonedDoc);
    const allProjects: Project[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    allProjects.unshift(newProject);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(allProjects));

    return { project: newProject, document: clonedDoc };
  }

  // Assets
  getAssets(): Asset[] {
    const org = this.getCurrentOrganization();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ASSETS);
      const all: Asset[] = data ? JSON.parse(data) : SEED_ASSETS;
      return all.filter(a => a.organizationId === org.id);
    } catch {
      return SEED_ASSETS;
    }
  }

  addAsset(name: string, url: string, type: Asset['type'], sizeBytes: number, altText: string = ''): Asset {
    const org = this.getCurrentOrganization();
    const all: Asset[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSETS) || '[]');
    const newAsset: Asset = {
      id: `ast_${Date.now()}`,
      organizationId: org.id,
      name,
      url,
      type,
      sizeBytes,
      altText,
      createdAt: new Date().toISOString(),
    };
    all.unshift(newAsset);
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(all));
    return newAsset;
  }

  deleteAsset(id: string): boolean {
    const all: Asset[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSETS) || '[]');
    const filtered = all.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(filtered));
    return true;
  }

  // Analytics
  getAnalyticsEvents(projectId?: string): AnalyticsEvent[] {
    const org = this.getCurrentOrganization();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      const all: AnalyticsEvent[] = data ? JSON.parse(data) : [];
      let filtered = all.filter(e => e.organizationId === org.id);
      if (projectId) {
        filtered = filtered.filter(e => e.projectId === projectId);
      }
      return filtered;
    } catch {
      return [];
    }
  }

  recordAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'organizationId' | 'timestamp'>): AnalyticsEvent {
    const org = this.getCurrentOrganization();
    const all: AnalyticsEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANALYTICS) || '[]');
    const newEvent: AnalyticsEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: org.id,
      timestamp: new Date().toISOString(),
    };
    all.unshift(newEvent);
    // Keep last 1,000 events locally
    if (all.length > 1000) all.length = 1000;
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(all));
    return newEvent;
  }

  // Survey responses
  getSurveyResponses(projectId?: string): SurveyResponse[] {
    const org = this.getCurrentOrganization();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SURVEY_RESPONSES);
      const all: SurveyResponse[] = data ? JSON.parse(data) : [];
      let filtered = all.filter(s => s.organizationId === org.id);
      if (projectId) filtered = filtered.filter(s => s.projectId === projectId);
      return filtered;
    } catch {
      return [];
    }
  }

  recordSurveyResponse(response: Omit<SurveyResponse, 'id' | 'organizationId' | 'createdAt'>): SurveyResponse {
    const org = this.getCurrentOrganization();
    const all: SurveyResponse[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SURVEY_RESPONSES) || '[]');
    const newResp: SurveyResponse = {
      ...response,
      id: `sr_${Date.now()}`,
      organizationId: org.id,
      createdAt: new Date().toISOString(),
    };
    all.unshift(newResp);
    localStorage.setItem(STORAGE_KEYS.SURVEY_RESPONSES, JSON.stringify(all));
    return newResp;
  }

  // Integrations
  getIntegrations(): IntegrationConfig[] {
    const org = this.getCurrentOrganization();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INTEGRATIONS);
      const all: IntegrationConfig[] = data ? JSON.parse(data) : SEED_INTEGRATIONS;
      return all.filter(i => i.organizationId === org.id);
    } catch {
      return SEED_INTEGRATIONS;
    }
  }

  updateIntegration(id: string, updates: Partial<IntegrationConfig>): IntegrationConfig | undefined {
    const all: IntegrationConfig[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS) || '[]');
    const index = all.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    all[index] = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(all));
    return all[index];
  }
}

export const storage = new StorageService();
