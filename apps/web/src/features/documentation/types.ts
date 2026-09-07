export interface DocSection {
  id: string;
  titleId: string;
  titleEn: string;
  icon: string;
  badge?: string;
  summaryId: string;
  summaryEn: string;
  contentId: string;
  contentEn: string;
  /** Nested child sections for collapsible tree navigation */
  children?: DocSection[];
  /** Optional path segment for URL routing (e.g., 'local_setup' -> /docs/quick_start/local_setup) */
  path?: string;
  subsections?: {
    id: string;
    titleId: string;
    titleEn: string;
    bodyId: string;
    bodyEn: string;
  }[];
  /** Optional: show/hide the call-to-action section. Defaults to true */
  showCta?: boolean;
}

export interface DocCategory {
  id: string;
  titleId: string;
  titleEn: string;
  icon: string;
  /** Optional path prefix for nested routing */
  pathPrefix?: string;
  /** Collapsible state - categories can be folders with nested items */
  collapsible?: boolean;
  sections: DocSection[];
}
