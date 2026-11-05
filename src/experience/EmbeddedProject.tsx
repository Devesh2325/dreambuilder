import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MODULES } from '../core/modules';
import { DocContent, ProjectSettings } from '../core/schema';
import { PublishedSnapshot } from '../data/services';
import { RenderContext } from '../renderer/types';
import { ExperiencePlayer, PlayerHost } from './ExperiencePlayer';

export type EmbedLoader = (projectId: string) => Promise<PublishedSnapshot | null>;

/** How this part of the app reads other projects: drafts for the team, published for visitors. */
export const EmbedLoaderContext = createContext<EmbedLoader | null>(null);

interface EmbeddedProjectProps {
  projectId: string;
  load: EmbedLoader;
  mode: RenderContext['mode'];
  submitForm?: (projectId: string, data: Record<string, unknown>) => ReturnType<NonNullable<RenderContext['submitForm']>>;
  track?: (projectId: string, eventType: string, metadata?: Record<string, unknown>) => void;
}

const note = (text: string) => <p className="fp-embed-empty">{text}</p>;

/** Node ids become class names, so a project inside a page needs ids of its own. */
const withOwnIds = (content: DocContent, prefix: string): DocContent => {
  const rename = (id: string) => `${prefix}${id}`;
  return {
    rootId: rename(content.rootId),
    nodes: Object.fromEntries(Object.values(content.nodes).map((node) => [rename(node.id), { ...node, id: rename(node.id), children: node.children.map(rename) }])),
  };
};

/**
 * A form, demo, banner or other project inside a page. What it plays is the same player
 * used everywhere else, so it behaves the way it does when installed on a customer's site.
 */
const EmbeddedProject: React.FC<EmbeddedProjectProps> = ({ projectId, load, mode, submitForm, track }) => {
  const [snapshot, setSnapshot] = useState<PublishedSnapshot | null | undefined>(undefined);
  const holder = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);

  useEffect(() => {
    let active = true;
    setSnapshot(undefined);
    load(projectId).then((result) => {
      if (active) setSnapshot(result);
    }).catch(() => {
      if (active) setSnapshot(null);
    });
    return () => {
      active = false;
    };
  }, [projectId, load]);

  useEffect(() => {
    setDoc(holder.current?.ownerDocument ?? null);
  }, []);

  const host = useMemo<PlayerHost | null>(() => (doc ? {
    targetDocument: doc,
    submitForm: submitForm ? (data) => submitForm(projectId, data) : undefined,
    track: track ? (eventType, metadata) => track(projectId, eventType, metadata) : undefined,
  } : null), [doc, projectId, submitForm, track]);

  const scopeId = `e${projectId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`;
  const original = snapshot?.documents[0]?.content;
  const scoped = useMemo(() => (original ? withOwnIds(original, `${scopeId}-`) : null), [original, scopeId]);
  const isEditing = mode === 'edit';
  let body: React.ReactNode = null;
  if (snapshot === null && isEditing) body = note('This project is not available. Choose another one.');
  else if (snapshot === undefined && isEditing) body = note('Loading...');
  else if (snapshot && host && snapshot.documents[0]) {
    const { project } = snapshot;
    const content = scoped!;
    const floats = project.type === 'tour' || Object.values(content.nodes).some((node) => node.type === 'Popup');
    if (isEditing && floats) {
      // A tour or popup would cover the editor, so here it only says what it will do.
      body = note(`${MODULES[project.type].label}: ${project.title}. It opens over this page for visitors.`);
    } else {
      // A bar placed in a page stays where it was put, rather than floating to the top.
      const settings: ProjectSettings = floats ? project.settings : { ...project.settings, position: 'inline' };
      body = <ExperiencePlayer type={project.type} content={content} theme={project.theme} variables={project.variables} settings={settings} host={host} scopeId={scopeId} mode={mode === 'live' ? 'live' : 'preview'} />;
    }
  }
  return <div ref={holder}>{body}</div>;
};

/** For the editor and previews, where an embedded project isn't to be used for real. */
export function useEmbedRenderer(mode: RenderContext['mode']): RenderContext['renderEmbed'] {
  const load = useContext(EmbedLoaderContext);
  return useMemo(() => {
    if (!load) return undefined;
    const render = (projectId: string) => <EmbeddedProject projectId={projectId} load={load} mode={mode} submitForm={async () => ({ ok: true })} />;
    return render;
  }, [load, mode]);
}

/** For published sites: real answers and real analytics, recorded against the embedded project. */
export function liveEmbedRenderer(load: EmbedLoader, submitForm: EmbeddedProjectProps['submitForm'], track: EmbeddedProjectProps['track']): RenderContext['renderEmbed'] {
  const render = (projectId: string) => <EmbeddedProject projectId={projectId} load={load} mode="live" submitForm={submitForm} track={track} />;
  return render;
}
