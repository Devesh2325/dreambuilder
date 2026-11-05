import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Theme } from '../../core/schema';
import { moduleNoun, MODULES } from '../../core/modules';
import { validateValues } from '../../core/validation';
import { VariableValues } from '../../core/variables';
import { DEVICE_WIDTHS, ProjectPreview } from '../../experience/ProjectPreview';
import { pagesOf } from '../../experience/SiteView';
import { applyBranding, getTemplate, initialValues, projectFromTemplate, TEAM_TEMPLATE_PREFIX, TemplateDefinition } from '../../templates';
import { ROUTES } from '../routes';
import { useServices } from '../session';
import { VariableForm } from '../shared/VariableForm';
import { BusyLabel, EmptyState, ErrorNote, errorMessage, inputClass, primaryButton, Skeleton, LoadingArea } from '../shared/ui';
import { useWorkspace } from '../workspace';
import { useTeamTemplates } from './CreatePage';
import { CreateSteps } from './CreateSteps';

const DEVICE_BUTTONS = [
  { device: 'desktop', label: 'Desktop', icon: Monitor },
  { device: 'tablet', label: 'Tablet', icon: Tablet },
  { device: 'mobile', label: 'Mobile', icon: Smartphone },
] as const;

export const WizardPage: React.FC = () => {
  const { templateId } = useParams();
  const team = useTeamTemplates();
  const isTeam = Boolean(templateId?.startsWith(TEAM_TEMPLATE_PREFIX));
  const template = !templateId ? undefined : isTeam ? team.templates.find((item) => item.id === templateId) : getTemplate(templateId);

  if (isTeam && (team.isLoading || team.isPending) && !template) {
    return (
      <LoadingArea className="h-screen flex bg-slate-50 dark:bg-slate-950">
        <div className="w-[400px] shrink-0 p-5 space-y-4 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
        <div className="flex-1 p-4"><Skeleton className="h-full" /></div>
      </LoadingArea>
    );
  }
  if (!template) {
    return (
      <div className="p-8">
        <EmptyState title="Template not found">
          <Link to={ROUTES.templates} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Back to templates</Link>
        </EmptyState>
      </div>
    );
  }
  // Keyed so going from one template to another starts with fresh values.
  return <Wizard key={template.id} template={template} />;
};

const Wizard: React.FC<{ template: TemplateDefinition }> = ({ template }) => {
  const { projects } = useServices();
  const { workspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const branding = workspace?.branding ?? {};

  const [values, setValues] = useState<VariableValues>(() => initialValues(template, branding));
  const [themeIndex, setThemeIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [device, setDevice] = useState<keyof typeof DEVICE_WIDTHS>('desktop');
  const [slug, setSlug] = useState('');
  const [projectName, setProjectName] = useState('');

  const theme: Theme = useMemo(() => applyBranding(template.themes[themeIndex].theme, branding), [template, themeIndex, branding]);
  const documents = useMemo(() => template.pages.map((page, position) => ({ ...page, position })), [template]);
  const pages = pagesOf(documents);

  const create = useMutation({
    mutationFn: async () => {
      const result = validateValues(template.variables, values);
      if (!result.ok) {
        setErrors(result.errors);
        throw new Error('Please fix the highlighted fields.');
      }
      setErrors({});
      return projects.create(projectFromTemplate(template, workspace!.organizationId, result.values, theme, projectName));
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-details'] });
      navigate(ROUTES.studio(id), { state: { justCreated: true } });
    },
  });

  return (
    <div className="app-scroll h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <header className="h-14 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={ROUTES.create(template.type)} aria-label="Back to templates" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">{MODULES[template.type].label} template</p>
            <h1 className="text-sm font-semibold truncate">{template.title}</h1>
          </div>
        </div>
        <CreateSteps current={2} />
        <div className="justify-self-end flex items-center gap-1" role="group" aria-label="Preview size">
          {DEVICE_BUTTONS.map(({ device: value, label, icon: DeviceIcon }) => (
            <button
              key={value}
              type="button"
              aria-label={label}
              aria-pressed={device === value}
              onClick={() => setDevice(value)}
              className={`p-1.5 rounded-lg ${device === value ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <DeviceIcon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <form
          className="w-full md:w-[400px] shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-0"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          noValidate
        >
          <div className="relative flex-1 overflow-y-auto p-5 space-y-8">
            <div>
              <h2 className="text-lg font-bold">Add your details</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">The preview updates as you type. You can change everything later.</p>
            </div>

            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project name (optional)</label>
              <input id="project-name" maxLength={200} className={inputClass} placeholder={template.title} value={projectName} onChange={(event) => setProjectName(event.target.value)} />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Only you see this, in your project list.</p>
            </div>

            <VariableForm defs={template.variables} values={values} errors={errors} onChange={setValues} />

            <section aria-label="Look and feel">
              <h2 className="text-sm font-bold mb-3">Look and feel</h2>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Color theme">
                {template.themes.map((preset, index) => (
                  <button
                    key={preset.name}
                    type="button"
                    role="radio"
                    aria-checked={themeIndex === index}
                    onClick={() => setThemeIndex(index)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs font-medium ${
                      themeIndex === index ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span className="flex shrink-0" aria-hidden="true">
                      <span className="w-4 h-4 rounded-full border border-black/10" style={{ background: preset.theme.primary }} />
                      <span className="w-4 h-4 -ml-1.5 rounded-full border border-black/10" style={{ background: preset.theme.background }} />
                    </span>
                    {preset.name}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <ErrorNote message={create.isError ? errorMessage(create.error) : null} />
            {can('create:project') ? (
              <button type="submit" disabled={create.isPending} className={`${primaryButton} w-full`}>
                <BusyLabel busy={create.isPending} busyText="Creating...">Create {moduleNoun(template.type)}</BusyLabel>
              </button>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">You have view-only access in this workspace.</p>
            )}
          </div>
        </form>

        <div className="flex-1 min-w-0 min-h-[400px] flex flex-col p-4 gap-2">
          {pages.length > 1 && (
            <div className="flex gap-1" role="group" aria-label="Preview page">
              {pages.map((page) => (
                <button
                  key={page.slug}
                  type="button"
                  aria-pressed={slug === page.slug}
                  onClick={() => setSlug(page.slug)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${slug === page.slug ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  {page.title}
                </button>
              ))}
            </div>
          )}
          <ProjectPreview
            type={template.type}
            documents={documents}
            theme={theme}
            variables={values}
            settings={template.settings ?? {}}
            device={device}
            initialSlug={slug}
            className="flex-1 min-h-0"
          />
        </div>
      </div>
    </div>
  );
};
