export const BIBLE_VERSE_PATTERN = /\b((?:1|2|3|I|II|III)?\s*[A-Za-z]+(?:\s+(?:of\s+)?[A-Za-z]+)*)\s+(\d+):?(\d+)?(?:-(\d+))?\b/g;

export const BOOK_NAME_MAP: Record<string, string> = {
  "gen": "Genesis", "genesis": "Genesis",
  "exo": "Exodus", "exodus": "Exodus",
  "lev": "Leviticus", "leviticus": "Leviticus",
  "num": "Numbers", "numbers": "Numbers",
  "deu": "Deuteronomy", "deut": "Deuteronomy", "deuteronomy": "Deuteronomy",
  "jos": "Joshua", "josh": "Joshua", "joshua": "Joshua",
  "jdg": "Judges", "judg": "Judges", "judges": "Judges",
  "rut": "Ruth", "ruth": "Ruth",
  "1sa": "1 Samuel", "1sam": "1 Samuel", "1 samuel": "1 Samuel", "1 sam": "1 Samuel",
  "2sa": "2 Samuel", "2sam": "2 Samuel", "2 samuel": "2 Samuel", "2 sam": "2 Samuel",
  "1ki": "1 Kings", "1 kings": "1 Kings", "1 kgs": "1 Kings",
  "2ki": "2 Kings", "2 kings": "2 Kings", "2 kgs": "2 Kings",
  "1ch": "1 Chronicles", "1 chronicles": "1 Chronicles", "1 chr": "1 Chronicles",
  "2ch": "2 Chronicles", "2 chronicles": "2 Chronicles", "2 chr": "2 Chronicles",
  "ezr": "Ezra", "ezra": "Ezra",
  "neh": "Nehemiah", "nehemiah": "Nehemiah",
  "est": "Esther", "esther": "Esther",
  "job": "Job",
  "psa": "Psalms", "psalm": "Psalms", "psalms": "Psalms", "ps": "Psalms",
  "pro": "Proverbs", "prov": "Proverbs", "proverbs": "Proverbs",
  "ecc": "Ecclesiastes", "eccl": "Ecclesiastes", "ecclesiastes": "Ecclesiastes",
  "sol": "Song of Solomon", "song": "Song of Solomon", "song of solomon": "Song of Solomon", "songs": "Song of Solomon", "song of songs": "Song of Solomon",
  "isa": "Isaiah", "isaiah": "Isaiah",
  "jer": "Jeremiah", "jeremiah": "Jeremiah",
  "lam": "Lamentations", "lamentations": "Lamentations",
  "eze": "Ezekiel", "ezek": "Ezekiel", "ezekiel": "Ezekiel",
  "dan": "Daniel", "daniel": "Daniel",
  "hos": "Hosea", "hosea": "Hosea",
  "joe": "Joel", "joel": "Joel",
  "amo": "Amos", "amos": "Amos",
  "oba": "Obadiah", "obadiah": "Obadiah",
  "jon": "Jonah", "jonah": "Jonah",
  "mic": "Micah", "micah": "Micah",
  "nah": "Nahum", "nahum": "Nahum",
  "hab": "Habakkuk", "habakkuk": "Habakkuk",
  "zep": "Zephaniah", "zephaniah": "Zephaniah",
  "hag": "Haggai", "haggai": "Haggai",
  "zec": "Zechariah", "zechariah": "Zechariah",
  "mal": "Malachi", "malachi": "Malachi",
  "mat": "Matthew", "matt": "Matthew", "matthew": "Matthew",
  "mar": "Mark", "mark": "Mark",
  "luk": "Luke", "luke": "Luke",
  "joh": "John", "john": "John",
  "act": "Acts", "acts": "Acts",
  "rom": "Romans", "romans": "Romans",
  "1co": "1 Corinthians", "1 corinthians": "1 Corinthians", "1 cor": "1 Corinthians",
  "2co": "2 Corinthians", "2 corinthians": "2 Corinthians", "2 cor": "2 Corinthians",
  "gal": "Galatians", "galatians": "Galatians",
  "eph": "Ephesians", "ephesians": "Ephesians",
  "phi": "Philippians", "phil": "Philippians", "philippians": "Philippians",
  "col": "Colossians", "colossians": "Colossians",
  "1th": "1 Thessalonians", "1 thessalonians": "1 Thessalonians", "1 thess": "1 Thessalonians",
  "2th": "2 Thessalonians", "2 thessalonians": "2 Thessalonians", "2 thess": "2 Thessalonians",
  "1ti": "1 Timothy", "1 timothy": "1 Timothy", "1 tim": "1 Timothy",
  "2ti": "2 Timothy", "2 timothy": "2 Timothy", "2 tim": "2 Timothy",
  "tit": "Titus", "titus": "Titus",
  "phm": "Philemon", "philemon": "Philemon",
  "heb": "Hebrews", "hebrews": "Hebrews",
  "jam": "James", "james": "James",
  "1pe": "1 Peter", "1 peter": "1 Peter", "1 pet": "1 Peter",
  "2pe": "2 Peter", "2 peter": "2 Peter", "2 pet": "2 Peter",
  "1jo": "1 John", "1 john": "1 John",
  "2jo": "2 John", "2 john": "2 John",
  "3jo": "3 John", "3 john": "3 John",
  "jud": "Jude", "jude": "Jude",
  "rev": "Revelation", "revelation": "Revelation",
};

export function normalizeBookName(rawBook: string): string {
  const normalized = rawBook.toLowerCase().trim();
  return BOOK_NAME_MAP[normalized] || rawBook.trim();
}

export interface ParsedReference {
  book: string;
  chapter: string;
  verse: string;
}

export function parseScriptureReference(reference: string): ParsedReference | null {
  if (!reference) return null;
  
  const pattern = new RegExp(BIBLE_VERSE_PATTERN.source);
  const match = reference.match(pattern);
  
  if (match) {
    const rawBook = match[1];
    const book = normalizeBookName(rawBook);
    const chapter = match[2];
    const verse = match[3] || "1";
    return { book, chapter, verse };
  }
  
  return null;
}

export function buildBibleLink(reference: string): string {
  const parsed = parseScriptureReference(reference);
  if (parsed) {
    return `/bible?book=${encodeURIComponent(parsed.book)}&chapter=${parsed.chapter}&verse=${parsed.verse}`;
  }
  return "/bible";
}
