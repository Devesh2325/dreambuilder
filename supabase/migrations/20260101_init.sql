-- FlowPilot Database Migration: Initial Multi-tenant Schema with Row Level Security (RLS)

-- 1. Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'starter' CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'enterprise')),
    branding JSONB DEFAULT '{"primaryColor": "#6366f1", "logoUrl": null}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY, -- references auth.users(id) in Supabase
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Organization Memberships (Role-based access control)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- 4. Projects (Experiences Containers)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('tour', 'demo', 'page', 'banner', 'menu', 'faq', 'popup', 'checklist', 'survey')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Documents (Core Visual Tree and Settings)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    schema_version INTEGER NOT NULL DEFAULT 1,
    root_node JSONB NOT NULL, -- Tree of component nodes
    theme_variables JSONB NOT NULL DEFAULT '{}'::jsonb,
    responsive_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    experience_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    trigger_conditions JSONB NOT NULL DEFAULT '{"urlRules": [], "delay": 0, "frequency": "once"}'::jsonb,
    target_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT FALSE,
    published_version_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Document Versions (Immutable Published Snapshots for Embed Runtime)
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    document_snapshot JSONB NOT NULL,
    published_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    change_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Analytics Events (Raw Ingested Events)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    step_id VARCHAR(100),
    visitor_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    device_type VARCHAR(50) DEFAULT 'desktop',
    browser VARCHAR(50),
    url TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Analytics Aggregates (Hourly/Daily Rollups)
CREATE TABLE IF NOT EXISTS analytics_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    starts INTEGER DEFAULT 0,
    completions INTEGER DEFAULT 0,
    cta_clicks INTEGER DEFAULT 0,
    dismissals INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    UNIQUE(project_id, date)
);

-- 9. Assets Library
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    alt_text TEXT,
    uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Survey Responses
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255) NOT NULL,
    rating INTEGER,
    feedback_text TEXT,
    answers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Checklist Progress
CREATE TABLE IF NOT EXISTS checklist_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255) NOT NULL,
    completed_task_ids TEXT[] DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, visitor_id)
);

-- 12. Integrations & Webhooks
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_events_project ON analytics_events(project_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_events_org ON analytics_events(organization_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_survey_project ON survey_responses(project_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Security Definition Functions
CREATE OR REPLACE FUNCTION auth_user_org_ids()
RETURNS SETOF UUID AS $$
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS: Organizations
CREATE POLICY org_access ON organizations
    FOR ALL USING (id IN (SELECT auth_user_org_ids()));

-- RLS: Organization Members
CREATE POLICY member_access ON organization_members
    FOR ALL USING (organization_id IN (SELECT auth_user_org_ids()));

-- RLS: Projects
CREATE POLICY project_access ON projects
    FOR ALL USING (organization_id IN (SELECT auth_user_org_ids()));

-- RLS: Documents
CREATE POLICY document_access ON documents
    FOR ALL USING (organization_id IN (SELECT auth_user_org_ids()));

-- RLS: Assets
CREATE POLICY asset_access ON assets
    FOR ALL USING (organization_id IN (SELECT auth_user_org_ids()));
