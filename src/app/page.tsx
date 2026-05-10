"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Loader2, BookOpen, GraduationCap, Filter } from "lucide-react";

type ProjectResult = {
  item: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    semester: string | null;
    student: { name: string; group: string | null };
    teacher: { name: string };
  };
  matches?: any[];
};

type Filters = {
  teachers: string[];
  semesters: string[];
};

// Відстань Levenshtейна з раннім виходом для прискорення (оптимізовано)
function levenshtein(a: string, b: string, maxErr?: number): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      rowMin = Math.min(rowMin, dp[i][j]);
    }
    // Ранній вихід: якщо навіть мінімальне значення рядку > maxErr, подальші немає сенсу
    if (maxErr !== undefined && rowMin > maxErr) return maxErr + 1;
  }
  return dp[a.length][b.length];
}

// Стоп-слова (те саме, що й на бекенді)
const STOP_WORDS = new Set(["так", "і", "й", "для", "по", "в", "у", "на", "з", "із", "до", "від", "при", "або", "та", "це", "то", "що", "як", "але", "щоб", "коли", "між"]);

// Парсить запит у значущі слова (без стоп-слів)
function parseQueryWords(query: string): string[] {
  return query.trim().split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w.toLowerCase()));
}

// Нормалізує рядок для порівняння: прибирає дефіси щоб "веб-додаток" = "вебдодаток"
function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/-/g, '');
}

// Повертає кількість слів запиту, для яких знайдено збіг у тексті (Levenshtein)
// Використовує нормалізований текст (без дефісів) для коректного порівняння
function countMatchingWords(text: string, queryWords: string[]): number {
  const textNorm = normalizeForMatch(text);
  let count = 0;
  for (const word of queryWords) {
    const wNorm = normalizeForMatch(word);
    const wLen = wNorm.length;
    let found = false;
    // Перевіряємо вікна -1/0/+1 відносно довжини слова:
    // wLen-1 — якщо в запиті зайва літера ("інтигтрованою" → "інтегрованою")
    // wLen   — для замін ("спльної" → "спільної" з однаковою довжиною)
    // wLen+1 — якщо в запиті пропущена літера ("спльної" → "спільної")
    for (const windowSize of [wLen - 2, wLen - 1, wLen, wLen + 1, wLen + 2].filter(s => s >= 2)) {
      const maxErr = Math.max(1, Math.floor(windowSize * 0.2));
      for (let i = 0; i <= textNorm.length - windowSize; i++) {
        if (levenshtein(wNorm, textNorm.slice(i, i + windowSize), maxErr) <= maxErr) {
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) count++;
  }
  return count;
}

// Компонент для підсвічування тексту зі стемм-пошуком (корінь слова).
// Виділяє всі слова тексту, що мають спільний корінь з кожним словом запиту.
// Наприклад: "мобільний" → виділяє "мобільного", "мобільних", "мобільному" тощо.
const HighlightText = ({ text, field: _field, query }: { text: string; matches?: any[]; field: string; query: string }) => {
  if (!text || !query.trim()) return <>{text}</>;

  const queryWords = parseQueryWords(query);
  if (queryWords.length === 0) return <>{text}</>;

  const textLower = text.toLowerCase();

  // Знаходимо всі "слова" в тексті (їхні позиції)
  const wordTokens: { start: number; end: number; lower: string }[] = [];
  const wordRegex = /[а-яіїєґa-z'ʼ]+/gi;
  let match: RegExpExecArray | null;
  while ((match = wordRegex.exec(textLower)) !== null) {
    wordTokens.push({ start: match.index, end: match.index + match[0].length - 1, lower: match[0] });
  }

  // Додаємо злиті токени для дефісних слів (веб-додаток → "вебдодаток")
  // Це вирішує проблему коли юзер пише "вебдодаток" а в назві є "веб-додаток"
  const allTokens = [...wordTokens];
  for (let i = 0; i < wordTokens.length - 1; i++) {
    const curr = wordTokens[i];
    const next = wordTokens[i + 1];
    // Якщо між токенами є дефіс — створюємо злитий токен
    if (textLower.slice(curr.end + 1, curr.end + 2) === '-' && next.start === curr.end + 2) {
      allTokens.push({
        start: curr.start,
        end: next.end,
        lower: curr.lower + next.lower // "веб" + "додаток" = "вебдодаток"
      });
    }
  }

  // Для кожного слова запиту знаходимо слова тексту зі спільним коренем
  const highlightRanges: [number, number][] = [];

  for (const qWord of queryWords) {
    const qLower = qWord.toLowerCase();
    // Мінімальна довжина спільного префікса (кореня): ~70% від коротшого слова
    const stemLen = Math.max(3, Math.floor(qLower.length * 0.7));
    const qStem = qLower.slice(0, stemLen);

    let bestToken: { start: number; end: number; lower: string } | null = null;

    for (const token of allTokens) {
      // Перевірка 1: спільний корінь (однакові перші stemLen символів — простий стемм)
      const hasCommonStem = token.lower.startsWith(qStem) || qLower.startsWith(token.lower.slice(0, stemLen));

      // Перевірка 2: нечіткий збіг (Levenshtein) для слів з помилками
      const maxErr = Math.floor(Math.min(qLower.length, token.lower.length) * 0.35);
      const minLen = Math.min(qLower.length, token.lower.length);
      const maxLen = Math.max(qLower.length, token.lower.length);
      const hasFuzzyMatch = maxLen <= minLen + 3 &&
        levenshtein(qLower, token.lower, maxErr) <= maxErr;

      if (hasCommonStem || hasFuzzyMatch) {
        // Вибираємо НАЙДОВШИЙ збіг (щоб "вебдодатку" переміг над "веб")
        if (!bestToken || (token.end - token.start) > (bestToken.end - bestToken.start)) {
          bestToken = token;
        }
      }
    }

    if (bestToken) {
      highlightRanges.push([bestToken.start, bestToken.end]);
    }
  }

  if (highlightRanges.length === 0) return <>{text}</>;

  highlightRanges.sort((a, b) => a[0] - b[0]);

  const result: (string | React.ReactNode)[] = [];
  let lastIndex = 0;

  highlightRanges.forEach(([start, end], i) => {
    if (start > lastIndex) result.push(text.slice(lastIndex, start));
    result.push(
      <mark key={i} style={{ backgroundColor: "rgba(46, 125, 50, 0.3)", color: "inherit", borderRadius: "2px", padding: "0 2px" }}>
        {text.slice(start, end + 1)}
      </mark>
    );
    lastIndex = end + 1;
  });

  if (lastIndex < text.length) result.push(text.slice(lastIndex));

  return <>{result}</>;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Фільтри
  const [availableFilters, setAvailableFilters] = useState<Filters>({ teachers: [], semesters: [] });
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  const [results, setResults] = useState<ProjectResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Дебаунсинг для пошукового запиту
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    // Завантаження доступних фільтрів залежно від того, що вже обрано
    const fetchFilters = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedTeacher) params.append("teacher", selectedTeacher);
        if (selectedSemester) params.append("semester", selectedSemester);

        const res = await fetch(`http://localhost:3001/filters?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          // Якщо нічого не обрано - завантажуємо все
          if (!selectedTeacher && !selectedSemester) {
            setAvailableFilters(data);
          } else {
            // Оновлюємо тільки протилежний список, щоб свій не зникав
            setAvailableFilters(prev => ({
              teachers: selectedTeacher ? prev.teachers : data.teachers,
              semesters: selectedSemester ? prev.semesters : data.semesters
            }));
          }
        }
      } catch (error) {
        console.error("Помилка завантаження фільтрів:", error);
      }
    };

    fetchFilters();
  }, [selectedTeacher, selectedSemester]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Якщо нічого не обрано, очищуємо результати і виходимо
    if (!debouncedQuery.trim() && !selectedTeacher && !selectedSemester) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (debouncedQuery.trim()) params.append("q", debouncedQuery);
      if (selectedTeacher) params.append("teacher", selectedTeacher);
      if (selectedSemester) params.append("semester", selectedSemester);

      const res = await fetch(`http://localhost:3001/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      } else {
        console.error("Помилка пошуку");
        setResults([]);
      }
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Автоматичний пошук при зміні дебаунсного запиту або фільтрів
  useEffect(() => {
    handleSearch();
  }, [debouncedQuery, selectedTeacher, selectedSemester]);

  // useMemo: фільтруємо результати через Levenshtein тільки при зміні results або debouncedQuery
  // НЕ перераховується при кожному рендері — вирішує проблему лагів
  const visibleResults = useMemo(() => {
    const queryWords = parseQueryWords(debouncedQuery);
    if (queryWords.length === 0) return results;
    const minMatches = Math.max(1, Math.round(queryWords.length * 0.8));
    return results.filter(p => {
      // Перевіряємо title та ім'я студента — щоб прізвища студентів не відфільтровувались
      const searchText = `${p.item.title} ${p.item.student?.name ?? ''}`;
      return countMatchingWords(searchText, queryWords) >= minMatches;
    });
  }, [results, debouncedQuery]);

  return (
    <main className="container" style={{ paddingTop: "7vh", paddingBottom: "5vh" }}>
      <div className="glass-panel animate-fade-in" style={{ padding: "3rem", margin: "0 auto", maxWidth: "900px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <div style={{ background: "rgba(46, 125, 50, 0.1)", padding: "1rem", borderRadius: "50%" }}>
              <GraduationCap size={48} color="var(--primary-color)" />
            </div>
          </div>
          <h1>Моніторинг дипломних проєктів</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
            Введіть тему роботи або скористайтесь фільтрами для швидкого пошуку проєктів кафедри.
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ marginBottom: "1.5rem" }}>
          <div style={{ position: "relative", marginBottom: "1rem" }}>
            <input
              type="text"
              className="input-control"
              placeholder='Наприклад: "автоматизація процесів"'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingRight: "120px", fontSize: "1.1rem" }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSearching || (!query.trim() && !selectedTeacher && !selectedSemester)}
              style={{ position: "absolute", right: "8px", top: "8px", bottom: "8px", padding: "0 1.5rem" }}
            >
              {isSearching ? <Loader2 className="animate-spin" size={20} /> : <><Search size={18} style={{ marginRight: "8px" }} /> Знайти</>}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              style={{
                background: "transparent", border: "none", color: "var(--primary-color)",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem"
              }}
            >
              <Filter size={16} /> {showFilters ? "Сховати фільтри" : "Розширений пошук"}
            </button>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Підказка: пошук толерантний до одруківок
            </span>
          </div>
        </form>

        {showFilters && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem", marginBottom: "2rem", padding: "1.5rem",
            backgroundColor: "var(--glass-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
          }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Семестр / Предмет</label>
              <select className="input-control" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                <option value="">Всі семестри</option>
                {availableFilters.semesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Всі викладачі</label>
              <select className="input-control" value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
                <option value="">Всі викладачі</option>
                {availableFilters.teachers.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )}

        {hasSearched && !isSearching && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", border: "1px dashed var(--border-color)", borderRadius: "12px", marginTop: "2rem" }}>
            <BookOpen size={48} color="var(--text-secondary)" style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
            <h3 style={{ color: "var(--text-secondary)" }}>За вашим запитом нічого не знайдено</h3>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
              Спробуйте змінити пошукове слово або зняти встановлені фільтри.
            </p>
          </div>
        )}

        {visibleResults.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h3 style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: "var(--text-primary)" }}>Результати пошуку: </span>
                <span style={{ color: "var(--success-color)", marginLeft: "8px" }}> {visibleResults.length === 100 ? "100+ (Показано перші 100)" : visibleResults.length}</span>
              </h3>
            </div>

            {visibleResults.map((project, index) => (
              <div
                key={project.item.id}
                className="glass-panel"
                style={{
                  padding: "1.5rem",
                  animation: `fadeIn 0.3s ease-out ${index % 10 * 0.05}s forwards`,
                  opacity: 0,
                  borderLeft: "4px solid var(--primary-color)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <h4 style={{ fontSize: "1.2rem", color: "var(--text-primary)", maxWidth: "80%" }}>
                    <HighlightText text={project.item.title} matches={project.matches} field="title" query={debouncedQuery} />
                  </h4>

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", backgroundColor: "rgba(0,0,0,0.03)", padding: "1rem", borderRadius: "8px" }}>
                  <div>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "block", marginBottom: "0.25rem" }}>Студент</span>
                    <strong style={{ color: "var(--text-primary)" }}>
                      <HighlightText text={project.item.student.name} matches={project.matches} field="student.name" query={debouncedQuery} />
                      {project.item.student.group ? <span style={{ color: "var(--primary-color)", marginLeft: "4px" }}>({project.item.student.group})</span> : ''}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "block", marginBottom: "0.25rem" }}>Керівник</span>
                    <strong style={{ color: "var(--text-primary)" }}>{project.item.teacher.name}</strong>
                  </div>
                </div>

                {project.item.description && (
                  <p style={{ marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                    {project.item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
