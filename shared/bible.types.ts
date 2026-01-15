export interface BibleVersion {
  id: string;
  abbreviation: string;
  name: string;
  language: string;
  description?: string;
}

export interface Book {
  id: string;
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong: string;
  testament: 'OT' | 'NT';
  chaptersCount?: number;
}

export interface Chapter {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
  content: string;
  next?: {
    id: string;
    number: string;
  };
  previous?: {
    id: string;
    number: string;
  };
}

export interface Verse {
  id: string;
  orgId: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  number: number;
  text: string;
  reference: string;
}

export interface SearchResult {
  verse: Verse;
  text: string;
  reference: string;
}

export interface Bookmark {
  id: string;
  verseId: string;
  reference: string;
  text: string;
  versionId: string;
  bookId: string;
  chapterId: string;
  createdAt: string;
}

export interface ReadingHistoryItem {
  id: string;
  chapterId: string;
  reference: string;
  versionId: string;
  timestamp: string;
}
