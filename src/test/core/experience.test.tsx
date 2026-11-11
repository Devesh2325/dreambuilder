import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DEFAULT_THEME, PROJECT_TYPES } from '../../core/schema';
import { MODULES } from '../../core/modules';
import { submissionsToCsv, csvCell } from '../../app/projects/projectHelpers';
import { createLocalServices } from '../../data/localServices';
import { ExperiencePlayer, PlayerHost } from '../../experience/ExperiencePlayer';
import { positionStep } from '../../experience/tourPosition';
import { buildContent, el, initialValues, projectFromTemplate, templatesFor } from '../../templates';

const host = (overrides: Partial<PlayerHost> = {}): PlayerHost => ({ targetDocument: document, ...overrides });

const actionButton = (text: string, action: string) => el('Button', { props: { text, action } });

const playTour = (content: ReturnType<typeof buildContent>, hostOverrides: Partial<PlayerHost> = {}) =>
  render(
    <ExperiencePlayer type="tour" content={content} theme={DEFAULT_THEME} variables={{}} settings={{}} host={host(hostOverrides)} />,
  );

describe('tour step positioning', () => {
  const viewport = { width: 1000, height: 800 };
  const step = { width: 300, height: 200 };
  const target = { top: 300, left: 400, width: 100, height: 40 };

  it('places on the requested side', () => {
    expect(positionStep(target, step, viewport, 'bottom')).toMatchObject({ top: 352, placement: 'bottom' });
    expect(positionStep(target, step, viewport, 'right')).toMatchObject({ left: 512, placement: 'right' });
  });

  it('flips when the requested side has no room', () => {
    expect(positionStep({ ...target, top: 700 }, step, viewport, 'bottom').placement).toBe('top');
    expect(positionStep({ ...target, top: 10 }, step, viewport, 'top').placement).toBe('bottom');
  });

  it('stays on screen', () => {
    const result = positionStep({ top: 300, left: 2, width: 10, height: 10 }, step, viewport, 'bottom');
    expect(result.left).toBeGreaterThanOrEqual(8);
    const big = positionStep({ top: 0, left: 0, width: 1000, height: 800 }, step, viewport, 'bottom');
    expect(big.top).toBeGreaterThanOrEqual(8);
    expect(big.top + step.height).toBeLessThanOrEqual(800);
  });
});

describe('experience player', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  describe('tours', () => {
    const steps = (first = '', second = '') => buildContent('n', [
      el('TourStep', { props: { selector: first } }, [el('Heading', { props: { text: 'First' } }), actionButton('Next', 'next')]),
      el('TourStep', { props: { selector: second } }, [el('Heading', { props: { text: 'Second' } }), actionButton('Back', 'prev'), actionButton('Finish', 'next'), actionButton('Close', 'close')]),
    ]);

    it('moves through steps and finishes with an event', async () => {
      const track = vi.fn();
      const onFinish = vi.fn();
      playTour(steps(), { track, onFinish });

      fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
      expect(await screen.findByRole('heading', { name: 'Second' })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(await screen.findByRole('heading', { name: 'First' })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));

      await waitFor(() => expect(onFinish).toHaveBeenCalledWith('completed'));
      expect(track).toHaveBeenCalledWith('tour_completed', { step: 2 });
      expect(screen.queryByRole('heading')).toBeNull();
    });

    it('reports closing early differently from finishing', async () => {
      const track = vi.fn();
      const onFinish = vi.fn();
      playTour(steps(), { track, onFinish, initialStep: 1 });
      fireEvent.click(await screen.findByRole('button', { name: 'Close' }));
      await waitFor(() => expect(onFinish).toHaveBeenCalledWith('closed'));
      expect(track).toHaveBeenCalledWith('tour_skipped', { step: 2 });
    });

    it('resumes from a saved step and reports changes', async () => {
      const onStepChange = vi.fn();
      playTour(steps(), { initialStep: 1, onStepChange });
      expect(await screen.findByRole('heading', { name: 'Second' })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(onStepChange).toHaveBeenCalledWith(0);
    });

    it('spotlights a target that exists', async () => {
      const target = document.createElement('button');
      target.id = 'real';
      document.body.appendChild(target);
      const { container } = playTour(steps('#real'));
      await waitFor(() => expect(container.querySelector('[data-fp-spotlight]')).not.toBeNull());
    });

    it('survives an invalid selector', async () => {
      const content = buildContent('n', [el('TourStep', { props: { selector: ':::nope' } }, [el('Heading', { props: { text: 'Still here' } })])]);
      playTour(content);
      // Waits for the missing-target fallback, then shows the step in the center.
      expect(await screen.findByRole('heading', { name: 'Still here' }, { timeout: 4000 })).toBeTruthy();
    });

    it('skips a step whose target is missing, when set to', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      const track = vi.fn();
      const content = buildContent('n', [
        el('TourStep', { props: { selector: '#gone', fallback: 'skip' } }, [el('Heading', { props: { text: 'Missing' } })]),
        el('TourStep', {}, [el('Heading', { props: { text: 'Next one' } })]),
      ]);
      playTour(content, { track });
      vi.setSystemTime(Date.now() + 3000);
      expect(await screen.findByRole('heading', { name: 'Next one', hidden: true })).toBeTruthy();
      expect(track).toHaveBeenCalledWith('tour_step_skipped', { step: 1, reason: 'missing_target' });
    });

    it('centers immediately in standalone mode even when target selector is missing', async () => {
      const content = buildContent('n', [
        el('TourStep', { props: { selector: '#missing-dom', fallback: 'skip' } }, [el('Heading', { props: { text: 'Standalone step' } })]),
      ]);
      playTour(content, { standalone: true });
      expect(await screen.findByRole('heading', { name: 'Standalone step', hidden: true })).toBeTruthy();
    });
  });

  describe('forms', () => {
    const play = (submitForm: PlayerHost['submitForm'], content = buildContent('n', [
      el('Form', { props: { submitText: 'Send', successMessage: 'Thanks!' } }, [
        el('FormField', { props: { name: 'email', label: 'Email', inputType: 'email', required: true } }),
      ]),
    ])) => render(<ExperiencePlayer type="form" content={content} theme={DEFAULT_THEME} variables={{}} settings={{}} host={host({ submitForm })} />);

    it('sends answers and shows the thank-you message', async () => {
      const submitForm = vi.fn(async () => ({ ok: true as const }));
      play(submitForm);
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.co' } });
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
      expect(await screen.findByText('Thanks!')).toBeTruthy();
      expect(submitForm).toHaveBeenCalledWith({ _hp: '', email: 'a@b.co' });
    });

    it('shows a failure and keeps the answers for retrying', async () => {
      play(async () => ({ ok: false, error: 'Too many submissions.' }));
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.co' } });
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
      expect((await screen.findByRole('alert')).textContent).toBe('Too many submissions.');
      expect((screen.getByLabelText(/Email/) as HTMLInputElement).value).toBe('a@b.co');
    });

    it('walks through steps, keeping earlier answers', async () => {
      const submitForm = vi.fn(async () => ({ ok: true as const }));
      play(submitForm, buildContent('n', [
        el('Form', { props: { submitText: 'Finish', successMessage: 'Done' } }, [
          el('FormStep', { props: { title: 'One' } }, [el('FormField', { props: { name: 'a', label: 'Field A' } })]),
          el('FormStep', { props: { title: 'Two' } }, [el('FormField', { props: { name: 'b', label: 'Field B' } })]),
        ]),
      ]));
      fireEvent.change(screen.getByLabelText('Field A'), { target: { value: 'first' } });
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      await screen.findByRole('button', { name: 'Finish' });
      fireEvent.change(screen.getByLabelText('Field B'), { target: { value: 'second' } });
      fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
      await waitFor(() => expect(submitForm).toHaveBeenCalled());
      expect(submitForm).toHaveBeenCalledWith(expect.objectContaining({ a: 'first', b: 'second' }));
    });
  });

  describe('demos', () => {
    it('moves between screens through hotspots and can jump', async () => {
      const content = buildContent('n', [
        el('DemoScreen', { props: { alt: 'One' } }, [el('DemoHotspot', { props: { tip: 'Go', goTo: 3 } })]),
        el('DemoScreen', { props: { alt: 'Two' } }, [el('DemoHotspot', { props: { tip: 'Two' } })]),
        el('DemoScreen', { props: { alt: 'Three' } }, [el('DemoHotspot', { props: { tip: 'End' } })]),
      ]);
      const track = vi.fn();
      render(<ExperiencePlayer type="demo" content={content} theme={DEFAULT_THEME} variables={{}} settings={{}} host={host({ track })} />);
      fireEvent.click(screen.getByRole('button', { name: 'Go' }));
      expect(await screen.findByAltText('Three')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'End' }));
      expect(track).toHaveBeenCalledWith('demo_completed');
      fireEvent.click(await screen.findByRole('button', { name: 'Get Started Free' }));
      expect(await screen.findByAltText('One')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Go' }));
      fireEvent.click(await screen.findByRole('button', { name: 'End' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Restart' }));
      expect(await screen.findByAltText('One')).toBeTruthy();
    });
  });

  describe('overlays', () => {
    it('closes a popup from its close button and backdrop', async () => {
      const content = buildContent('n', [el('Popup', {}, [el('Heading', { props: { text: 'Offer' } })])]);
      const onFinish = vi.fn();
      const track = vi.fn();
      render(<ExperiencePlayer type="banner" content={content} theme={DEFAULT_THEME} variables={{}} settings={{}} host={host({ onFinish, track })} />);
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(screen.queryByRole('heading', { name: 'Offer' })).toBeNull());
      expect(onFinish).toHaveBeenCalledWith('closed');
      expect(track).toHaveBeenCalledWith('banner_dismissed');
    });
  });

  describe('every template', () => {
    it.each(PROJECT_TYPES.filter((type) => MODULES[type].delivery !== 'site'))('%s templates play without errors', async (type) => {
      const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      for (const template of templatesFor(type)) {
        const project = projectFromTemplate(template, 'org', initialValues(template), template.themes[0].theme);
        const { unmount, container } = render(
          <ExperiencePlayer type={type} content={project.documents[0].content} theme={project.theme} variables={project.variables} settings={project.settings} host={host()} />,
        );
        await act(async () => { await Promise.resolve(); });
        expect(container.querySelector('.fp-root')).not.toBeNull();
        unmount();
      }
      expect(errors).not.toHaveBeenCalled();
      errors.mockRestore();
    });
  });
});

describe('every module goes from template to published', () => {
  it.each(PROJECT_TYPES)('%s', async (type) => {
    localStorage.clear();
    const services = createLocalServices();
    const template = templatesFor(type)[0];
    const id = await services.projects.create(projectFromTemplate(template, 'org', initialValues(template), template.themes[0].theme));

    expect(await services.publicApi.getPublishedExperience(id)).toBeNull();
    await services.publishing.publish(id, 'First');
    const published = await services.publicApi.getPublishedExperience(id);
    expect(published?.project.type).toBe(type);
    expect(published?.documents.length).toBe(template.pages.length);

    const project = await services.projects.get(id);
    expect(await services.publicApi.getPublishedSite(project!.slug!)).toEqual(published);
  });
});

describe('local backend', () => {
  it('keeps webhook addresses out of what visitors receive', async () => {
    localStorage.clear();
    const services = createLocalServices();
    const template = templatesFor('form')[0];
    const id = await services.projects.create({
      ...projectFromTemplate(template, 'org', initialValues(template), DEFAULT_THEME),
      settings: { webhookUrl: 'https://hooks.example.com/secret' },
    });
    await services.publishing.publish(id);
    expect(JSON.stringify(await services.publicApi.getPublishedExperience(id))).not.toContain('secret');
    expect((await services.projects.get(id))!.settings.webhookUrl).toContain('secret');
  });
});

describe('CSV export', () => {
  it('quotes values and protects against spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
    expect(csvCell('+1 555')).toBe(`"'+1 555"`);
    expect(csvCell('plain, text')).toBe('"plain, text"');
    expect(csvCell(undefined)).toBe('""');
  });

  it('uses all columns across responses', () => {
    const csv = submissionsToCsv([
      { id: '1', createdAt: 'T1', data: { a: 'x' } },
      { id: '2', createdAt: 'T2', data: { b: 'y' } },
    ]);
    expect(csv.split('\r\n')).toEqual(['"Received","a","b"', '"T1","x",""', '"T2","","y"']);
  });
});
