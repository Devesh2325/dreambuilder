import React, { useMemo } from 'react';
import { DocContent, DocumentKind, GLOBAL_FOOTER_SLUG, GLOBAL_HEADER_SLUG, Theme } from '../core/schema';
import { VariableValues } from '../core/variables';
import { ExperienceView } from '../renderer/ExperienceView';
import { NavLink, RenderContext } from '../renderer/types';

export interface SiteDocument {
  kind: DocumentKind;
  title: string;
  slug: string;
  position: number;
  content: DocContent;
}

export const pagesOf = <T extends SiteDocument>(documents: T[]) =>
  documents.filter((doc) => doc.kind === 'page').sort((a, b) => a.position - b.position);

export function buildNavLinks(documents: SiteDocument[], currentSlug: string): NavLink[] {
  return pagesOf(documents).map((page) => ({
    label: page.title,
    href: `/${page.slug}`,
    current: page.slug === currentSlug,
  }));
}

/** Documents to draw for a page: shared header, the page, shared footer. */
export function pageStack(documents: SiteDocument[], slug: string): DocContent[] {
  const find = (s: string) => documents.find((doc) => doc.slug === s);
  const page = pagesOf(documents).find((doc) => doc.slug === slug);
  if (!page) return [];
  return [find(GLOBAL_HEADER_SLUG), page, find(GLOBAL_FOOTER_SLUG)].flatMap((doc) => (doc ? [doc.content] : []));
}

interface SiteViewProps {
  documents: SiteDocument[];
  slug: string;
  theme: Theme;
  variables: VariableValues;
  ctx: Omit<RenderContext, 'navLinks'>;
}

export const SiteView: React.FC<SiteViewProps> = ({ documents, slug, theme, variables, ctx }) => {
  const stack = useMemo(() => pageStack(documents, slug), [documents, slug]);
  const navLinks = useMemo(() => buildNavLinks(documents, slug), [documents, slug]);
  return <ExperienceView documents={stack} theme={theme} variables={variables} ctx={{ ...ctx, navLinks }} />;
};
