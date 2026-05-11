"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Loader2, BookOpen, GraduationCap, Filter } from "lucide-react";
import { getHighlightParts } from "@/utils/search";

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

// Компонент для підсвічування тексту
const HighlightText = ({ text, query }: { text: string; query: string }) => {
  const parts = getHighlightParts(text, query);

  return (
    <>
      {parts.map((part, i) => 
        part.highlight ? (
          <mark key={i} style={{ backgroundColor: "rgba(46, 125, 50, 0.3)", color: "inherit", borderRadius: "2px", padding: "0 2px" }}>
            {part.text}
          </mark>
        ) : (
          part.text
        )
      )}
    </>
  );
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
    return results;
  }, [results]);

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
                    <HighlightText text={project.item.title} query={debouncedQuery} />
                  </h4>

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", backgroundColor: "rgba(0,0,0,0.03)", padding: "1rem", borderRadius: "8px" }}>
                  <div>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "block", marginBottom: "0.25rem" }}>Студент</span>
                    <strong style={{ color: "var(--text-primary)" }}>
                      <HighlightText text={project.item.student.name} query={debouncedQuery} />
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
