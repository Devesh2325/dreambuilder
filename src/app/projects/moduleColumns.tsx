import React from 'react';
import { MODULES } from '../../core/modules';
import { ProjectType } from '../../core/schema';
import { DocumentRecord, ProjectRecord } from '../../data/services';
import { Icon } from '../shared/Icon';
import { bannerStyle, describeFrequency, describePages, describeTrigger, isPopupBanner, moduleCount } from './projectHelpers';

export interface ProjectRow {
  project: ProjectRecord;
  documents: DocumentRecord[];
  responses: number;
}

export interface ModuleColumn {
  label: string;
  value: (row: ProjectRow) => React.ReactNode;
  numeric?: boolean;
}

const addressColumn: ModuleColumn = {
  label: 'Address',
  value: ({ project }) => (project.slug && project.status === 'published'
    ? <span className="font-mono text-xs">/s/{project.slug}</span>
    : <span className="text-slate-400">Not published</span>),
};
const responsesColumn: ModuleColumn = { label: 'Responses', numeric: true, value: ({ responses }) => responses };
const countColumn = (label: string, blockType: string): ModuleColumn => ({
  label,
  numeric: true,
  value: ({ project, documents }) => moduleCount(project, documents, blockType),
});
const appearsColumn: ModuleColumn = { label: 'Appears on', value: ({ project }) => describePages(project.settings) };
const oftenColumn: ModuleColumn = { label: 'How often', value: ({ project }) => describeFrequency(project.settings) };

/** What matters for each module. Used by its table and its project page. */
export const MODULE_COLUMNS: Record<ProjectType, ModuleColumn[]> = {
  website: [{ label: 'Pages', numeric: true, value: ({ documents }) => documents.filter((doc) => doc.kind === 'page').length }, addressColumn, responsesColumn],
  page: [addressColumn, responsesColumn],
  tour: [countColumn('Steps', 'TourStep'), appearsColumn, oftenColumn],
  form: [countColumn('Fields', 'FormField'), responsesColumn, addressColumn],
  demo: [countColumn('Screens', 'DemoScreen'), addressColumn],
  banner: [
    { label: 'Style', value: ({ documents }) => bannerStyle(documents) },
    { label: 'Shows', value: ({ project, documents }) => (isPopupBanner(documents) ? `Center of screen, ${describeTrigger(project.settings).toLowerCase()}` : ({ top: 'Top of page', bottom: 'Bottom of page', inline: 'Inside page' }[project.settings.position ?? 'top'])) },
    appearsColumn,
    oftenColumn,
  ],
  menu: [{
    label: 'Items',
    numeric: true,
    value: ({ project }) => {
      const links = project.variables.links;
      return Array.isArray(links) ? links.length : '-';
    },
  }, addressColumn],
  faq: [countColumn('Questions', 'Accordion'), addressColumn],
};

export const ALL_COLUMNS: ModuleColumn[] = [
  {
    label: 'Type',
    value: ({ project }) => (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <Icon name={MODULES[project.type].icon} className="w-3.5 h-3.5 text-slate-400" />
        {MODULES[project.type].label}
      </span>
    ),
  },
  addressColumn,
];

/** Modules whose content can include a form, so they have responses to show. */
export const collectsResponses = (type: ProjectType) => ['website', 'page', 'form', 'banner'].includes(type);
