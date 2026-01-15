import type { BibleVersion, Book, Chapter } from "../shared/bible.types";

const API_KEY = process.env.BIBLE_API_KEY || "";
const BASE_URL = "https://rest.api.bible/v1";

const OLD_TESTAMENT_BOOKS = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
  "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
  "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO",
  "OBA", "JON", "MIC", "NAH", "HAB", "ZEP", "HAG", "ZEC", "MAL"
];

function getTestament(bookId: string): "OT" | "NT" {
  const cleanId = bookId.split(".")[0].toUpperCase();
  return OLD_TESTAMENT_BOOKS.includes(cleanId) ? "OT" : "NT";
}

export const bibleAPI = {
  async getVersions(): Promise<BibleVersion[]> {
    const response = await fetch(`${BASE_URL}/bibles`, {
      headers: { "api-key": API_KEY },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch versions: ${response.status}`);
    }
    const data = await response.json();
    
    const supportedVersions = ["KJV", "NIV", "ESV", "NLT", "ASV", "WEB"];
    return data.data
      .filter((v: any) => 
        v.language?.id === "eng" && 
        supportedVersions.some(sv => v.abbreviation?.toUpperCase().includes(sv))
      )
      .slice(0, 6)
      .map((v: any) => ({
        id: v.id,
        abbreviation: v.abbreviation,
        name: v.name,
        language: v.language?.id || "eng",
        description: v.description,
      }));
  },

  async getBooks(bibleId: string): Promise<Book[]> {
    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/books`, {
      headers: { "api-key": API_KEY },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.status}`);
    }
    const data = await response.json();
    
    return data.data.map((book: any) => ({
      id: book.id,
      bibleId: book.bibleId,
      abbreviation: book.abbreviation,
      name: book.name,
      nameLong: book.nameLong,
      testament: getTestament(book.id),
    }));
  },

  async getChapters(bibleId: string, bookId: string): Promise<{ id: string; number: string; reference: string }[]> {
    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/books/${bookId}/chapters`, {
      headers: { "api-key": API_KEY },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch chapters: ${response.status}`);
    }
    const data = await response.json();
    
    return data.data
      .filter((ch: any) => ch.number !== "intro")
      .map((ch: any) => ({
        id: ch.id,
        number: ch.number,
        reference: ch.reference,
      }));
  },

  async getChapter(bibleId: string, chapterId: string): Promise<Chapter> {
    const response = await fetch(
      `${BASE_URL}/bibles/${bibleId}/chapters/${chapterId}?content-type=text&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true`,
      { headers: { "api-key": API_KEY } }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch chapter: ${response.status}`);
    }
    const data = await response.json();
    const chapter = data.data;
    
    return {
      id: chapter.id,
      bibleId: chapter.bibleId,
      bookId: chapter.bookId,
      number: chapter.number,
      reference: chapter.reference,
      content: chapter.content,
      next: chapter.next ? { id: chapter.next.id, number: chapter.next.number } : undefined,
      previous: chapter.previous ? { id: chapter.previous.id, number: chapter.previous.number } : undefined,
    };
  },

  async search(bibleId: string, query: string, limit: number = 20): Promise<any[]> {
    const response = await fetch(
      `${BASE_URL}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=${limit}`,
      { headers: { "api-key": API_KEY } }
    );
    if (!response.ok) {
      throw new Error(`Failed to search: ${response.status}`);
    }
    const data = await response.json();
    
    return data.data?.verses || [];
  },
};
