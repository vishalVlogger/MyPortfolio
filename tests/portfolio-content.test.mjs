import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultPortfolio } from '../lib/portfolio.ts';
import { isPortfolioData } from '../lib/portfolio-validation.ts';
import {
  cleanPortfolio,
  findPortfolioIssue,
  preparePortfolio,
} from '../lib/portfolio-content.ts';

void test('blank lines left while editing are removed before saving', () => {
  const draft = {
    ...defaultPortfolio,
    experience: [
      { ...defaultPortfolio.experience[0], bullets: ['Shipped it', '', '  '] },
    ],
    learning: ['RAG', ''],
  };
  assert.equal(isPortfolioData(draft), false);
  const cleaned = cleanPortfolio(draft);
  assert.deepEqual(cleaned.experience[0].bullets, ['Shipped it']);
  assert.deepEqual(cleaned.learning, ['RAG']);
  assert.equal(isPortfolioData(cleaned), true);
});

void test('validation issues name the section or profile field at fault', () => {
  assert.equal(findPortfolioIssue(defaultPortfolio), null);
  const badLink = {
    ...defaultPortfolio,
    hero: { ...defaultPortfolio.hero, linkedin: 'linkedin.com/in/me' },
  };
  assert.match(findPortfolioIssue(badLink), /Profile → linkedin/);
  const badProject = {
    ...defaultPortfolio,
    projects: [{ ...defaultPortfolio.projects[0], liveUrl: 'http://x.test' }],
  };
  assert.match(findPortfolioIssue(badProject), /^Projects:/);
});

void test('booking notes are optional, bounded strings', () => {
  const withNotes = {
    ...defaultPortfolio,
    contact: {
      ...defaultPortfolio.contact,
      responseNote: 'Replies within a day',
      meetingNote: 'Teams',
    },
  };
  assert.equal(isPortfolioData(withNotes), true);
  assert.equal(
    isPortfolioData({
      ...withNotes,
      contact: { ...withNotes.contact, meetingNote: 'x'.repeat(201) },
    }),
    false,
  );
});

void test('stored content is filled from defaults when sections are missing', () => {
  const stored = { ...defaultPortfolio };
  delete stored.education;
  delete stored.certifications;
  delete stored.testimonials;
  const prepared = preparePortfolio(stored);
  assert.deepEqual(prepared.education, defaultPortfolio.education);
  assert.deepEqual(prepared.certifications, defaultPortfolio.certifications);
});
