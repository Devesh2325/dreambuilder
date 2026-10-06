import { ExperienceType } from './document';

export interface Project {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  type: ExperienceType;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  documentId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  viewsCount?: number;
  completionRate?: number;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  projectId: string;
  organizationId: string;
  versionNumber: number;
  documentSnapshot: any;
  publishedBy: string;
  changeSummary?: string;
  createdAt: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: ExperienceType | 'general';
  tags: string[];
  thumbnail: string;
  stepsCount: number;
  isPopular?: boolean;
  documentData: any;
}

export interface Asset {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'icon';
  sizeBytes: number;
  altText: string;
  folder?: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  organizationId: string;
  projectId: string;
  documentId: string;
  eventType: 
    | 'impression'
    | 'tour_started'
    | 'tour_step_viewed'
    | 'tour_step_completed'
    | 'tour_skipped'
    | 'tour_completed'
    | 'demo_started'
    | 'demo_step_completed'
    | 'demo_completed'
    | 'banner_viewed'
    | 'banner_dismissed'
    | 'cta_clicked'
    | 'popup_displayed'
    | 'popup_dismissed'
    | 'faq_expanded'
    | 'checklist_task_completed'
    | 'survey_submitted'
    | 'page_viewed';
  stepId?: string;
  visitorId: string;
  sessionId: string;
  metadata?: Record<string, any>;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  url?: string;
  timestamp: string;
}

export interface SurveyResponse {
  id: string;
  organizationId: string;
  projectId: string;
  visitorId: string;
  rating?: number;
  feedbackText?: string;
  answers: Record<string, any>;
  createdAt: string;
}

export interface IntegrationConfig {
  id: string;
  organizationId: string;
  provider: 'custom_domain' | 'google_analytics' | 'webhook' | 'slack' | 'segment' | 'hubspot';
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'configuring';
  config: Record<string, any>;
  updatedAt: string;
}
