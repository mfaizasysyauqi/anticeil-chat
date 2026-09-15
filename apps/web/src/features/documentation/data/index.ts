import { DocCategory, DocSection } from '../types';
import { gettingStartedCategory } from './gettingStarted';
import { creditsCategory } from './creditsData';
import { byokCategory } from './byokData';
import { docsStudioCategory, storageCategory } from './docsAndStorage';
import { faqCategory } from './faq';
import { chatStudioCategory } from './chatStudioData';
import { connectorsCategory } from './connectorsData';
import { promptsCategory } from './promptsData';
import { settingsCategory, authCategory } from './settingsData';

export const DOC_CATEGORIES: DocCategory[] = [
  gettingStartedCategory,
  chatStudioCategory,
  docsStudioCategory,
  connectorsCategory,
  creditsCategory,
  byokCategory,
  promptsCategory,
  settingsCategory,
  authCategory,
  storageCategory,
  faqCategory,
];

export const ALL_DOC_SECTIONS: DocSection[] = DOC_CATEGORIES.flatMap((c) => c.sections);

