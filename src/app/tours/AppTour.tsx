import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ProjectSettings } from '../../core/schema';
import { ExperiencePlayer, PlayerHost } from '../../experience/ExperiencePlayer';
import { buildContent, el, El } from '../../templates/dsl';
import { THEME_INDIGO } from '../../templates/themes';

export type AppTourId = 'dashboard' | 'editor';

interface TourStepDef {
  title: string;
  text: string;
  /** Left out for a welcome message in the middle of the screen. */
  target?: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

const TOURS: Record<AppTourId, TourStepDef[]> = {
  dashboard: [
    { title: 'Welcome to FlowPilot', text: "Here's a quick look around. It takes under a minute, and you can leave at any time." },
    { target: '[data-tour="build"]', placement: 'top', title: 'Start here', text: 'Choose what you want to make: a website, a page, a tour, a form and more. Each has its own templates.' },
    { target: '[data-tour="nav"]', placement: 'right', title: 'Everything in one place', text: 'Your projects are listed by kind. Below them are your images, brand kit, team and analytics.' },
    { target: '[data-tour="stats"]', placement: 'bottom', title: 'See how it is going', text: 'Your live projects, views and form responses appear here once people visit.' },
    { target: '[data-tour="profile"]', placement: 'top', title: 'Your profile', text: 'Set your name and time zone here. Plans and Support are in the menu above if you need them.' },
  ],
  editor: [
    { title: 'Welcome to the editor', text: "Change anything you like here. Every change saves by itself, and visitors don't see it until you publish." },
    { target: '[data-tour="canvas"]', placement: 'left', title: 'This is your page', text: 'Click anything to edit it, and double-click text to type. Drag a block to move it.' },
    { target: '[data-tour="tool-add"]', placement: 'right', title: 'Add more', text: 'Add blocks and ready-made sections. Drag them onto the page, or click to add.' },
    { target: '[data-tour="tool-variables"]', placement: 'right', title: 'Change it once', text: 'Things you use more than once, such as your business name, live here. Change one and every place updates.' },
    { target: '[data-tour="tool-theme"]', placement: 'right', title: 'Your look', text: 'Choose the colors and fonts for the whole project in one go.' },
    { target: '[data-tour="devices"]', placement: 'bottom', title: 'Every screen size', text: 'Switch to tablet or mobile to see it there. A change you make there only affects that size.' },
    { target: '[data-tour="publish"]', placement: 'bottom', title: 'Go live', text: 'Preview it first, then publish when you are ready. Every publish is saved, so you can always go back.' },
  ],
};

const buildTour = (steps: TourStepDef[]) => buildContent('t', steps.map((step, index): El => el('TourStep', {
  props: {
    selector: step.target ?? '',
    layout: step.target ? 'tooltip' : 'modal',
    placement: step.placement ?? 'bottom',
    // A menu can be hidden at this moment, and the tour shouldn't get stuck on it.
    fallback: 'skip',
    spotlight: true,
    size: 'medium',
  },
}, [
  el('Heading', { props: { text: step.title, level: 'h4' } }),
  el('Text', { props: { text: step.text } }),
  el('Row', { styles: { justifyContent: 'flex-end', gap: '8px' } }, [
    ...(index > 0 ? [el('Button', { props: { text: 'Back', action: 'prev', variant: 'secondary', href: '#' } })] : []),
    el('Button', { props: { text: index === steps.length - 1 ? 'Done' : 'Next', action: 'next', variant: 'primary', href: '#' } }),
  ]),
])));

const SETTINGS: ProjectSettings = { tour: { showProgress: true, showClose: true, keyboard: true, waitSeconds: 1 } };
const NO_VARIABLES = {};

/** FlowPilot's own help, played by the same tour player customers' tours use. */
export const AppTour: React.FC<{ id: AppTourId; onDone: () => void }> = ({ id, onDone }) => {
  const content = useMemo(() => buildTour(TOURS[id]), [id]);
  const host = useMemo<PlayerHost>(() => ({ targetDocument: document, onFinish: onDone }), [onDone]);
  return <ExperiencePlayer type="tour" content={content} theme={THEME_INDIGO.theme} variables={NO_VARIABLES} settings={SETTINGS} host={host} />;
};

const seenKey = (id: AppTourId) => `fp_tour_seen_${id}`;

const hasSeen = (id: AppTourId) => {
  try {
    return localStorage.getItem(seenKey(id)) === '1';
  } catch {
    // Without storage it would start on every page load, so it stays off.
    return true;
  }
};

/** Starts by itself the first time, once `ready` is true, and from a button after that. */
export function useAppTour(id: AppTourId, ready: boolean) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (ready && !hasSeen(id)) setIsOpen(true);
  }, [id, ready]);

  const finish = useCallback(() => {
    setIsOpen(false);
    try {
      localStorage.setItem(seenKey(id), '1');
    } catch {
      // Handled by hasSeen.
    }
  }, [id]);

  const start = useCallback(() => setIsOpen(true), []);
  return { isOpen, start, finish };
}
