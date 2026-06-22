'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, RefreshCw, FileText, CheckCircle, AlertCircle, Search, ChevronDown, ChevronUp, Github, FileDown } from 'lucide-react';
import { calculateSearchScore } from '@/utils/search';

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [archiveExpanded, setArchiveExpanded] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'TEACHER') {
      router.push('/login');
      return;
    }
    setUser(parsedUser);
    fetchData(parsedUser.id);

    // Автооновлення кожні 10 секунд
    const interval = setInterval(() => {
      fetchData(parsedUser.id, false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async (userId: string, showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/projects?userId=${userId}&role=TEACHER`);
      const data = await res.json();
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const approveProject = async (id: string) => {
    await fetch(`http://localhost:3001/api/projects/${id}/approve`, { method: 'POST' });
    fetchData(user.id);
  };

  const rejectProject = async (id: string) => {
    await fetch(`http://localhost:3001/api/projects/${id}/reject`, { method: 'POST' });
    fetchData(user.id);
  };

  const approveTitleChange = async (id: string) => {
    await fetch(`http://localhost:3001/api/projects/${id}/approve-title`, { method: 'POST' });
    fetchData(user.id);
  };

  const approveChapter = async (chapterId: string) => {
    await fetch(`http://localhost:3001/api/chapters/${chapterId}/approve`, { method: 'POST' });
    fetchData(user.id);
  };

  const reworkChapter = async (chapterId: string) => {
    await fetch(`http://localhost:3001/api/chapters/${chapterId}/rework`, { method: 'POST' });
    fetchData(user.id);
  };

  const togglePublication = async (projectId: string) => {
    await fetch(`http://localhost:3001/api/projects/${projectId}/toggle-publication`, { method: 'POST' });
    fetchData(user.id);
  };



  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Завантаження...</div>;

  const pendingProjects = projects.filter(p => p.status === 'PENDING');
  const activeProjects = projects.filter(p => p.status === 'APPROVED');
  const completedProjects = projects.filter(p => p.status === 'COMPLETED');
  
  const getFilteredActive = () => {
    let list = activeProjects.filter(p => {
      const matchesGroup = !groupFilter || (p.student.group && p.student.group.toLowerCase().includes(groupFilter.toLowerCase()));
      return matchesGroup;
    });

    if (searchQuery) {
      list = list
        .map(p => ({ p, score: calculateSearchScore(`${p.student.name} ${p.title}`, searchQuery) }))
        .filter(res => res.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(res => res.p);
    }
    return list;
  };

  const filteredActive = getFilteredActive();

  const getFilteredCompleted = () => {
    let list = completedProjects.filter(p => {
      const matchesGroup = !groupFilter || (p.student.group && p.student.group.toLowerCase().includes(groupFilter.toLowerCase()));
      return matchesGroup;
    });

    if (searchQuery) {
      list = list
        .map(p => ({ p, score: calculateSearchScore(`${p.student.name} ${p.title}`, searchQuery) }))
        .filter(res => res.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(res => res.p);
    }
    return list;
  };

  const filteredCompleted = getFilteredCompleted();

  return (
    <div className="container" style={{ paddingTop: '5vh', paddingBottom: '5vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Кабінет Викладача</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{user?.name}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Запити на нові теми */}
        {pendingProjects.length > 0 && (
          <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Нові запити на теми ({pendingProjects.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingProjects.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{p.pool?.name}</div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{p.title}</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Студент: {p.student.name} {p.student.group ? `(${p.student.group})` : ''}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => approveProject(p.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', background: 'var(--success-color)' }}><Check size={18} style={{ marginRight: '4px' }}/> Підтвердити</button>
                    <button onClick={() => rejectProject(p.id)} className="btn" style={{ padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}><X size={18} style={{ marginRight: '4px' }}/> Відхилити</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Активні роботи */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Роботи в процесі ({activeProjects.length})</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '250px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ paddingLeft: '2.5rem' }} 
                  placeholder="Пошук студента/теми..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div style={{ width: '200px' }}>
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Фільтр груп (напр. ІПЗ)..." 
                  value={groupFilter}
                  onChange={e => setGroupFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {filteredActive.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Немає активних робіт, що відповідають пошуку.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredActive.map(p => (
                <div key={p.id} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <div 
                    onClick={() => setExpandedProjectId(expandedProjectId === p.id ? null : p.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', cursor: 'pointer', transition: 'background 0.2s', background: expandedProjectId === p.id ? 'rgba(0,0,0,0.02)' : 'transparent' }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{p.pool?.name}</div>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', marginBottom: '0.2rem' }}>{p.student.name} {p.student.group ? `(${p.student.group})` : ''}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{p.title}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {p.chapters.some((c: any) => c.status === 'SUBMITTED') && (
                        <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>ПОТРЕБУЄ УВАГИ</span>
                      )}
                      {expandedProjectId === p.id ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
                    </div>
                  </div>

                  {expandedProjectId === p.id && (
                    <div style={{ padding: '1.5rem', borderTop: '1px dashed var(--border-color)', background: 'var(--bg-color)' }}>
                      {/* Запит на зміну теми */}
                      {p.proposedTitle && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: '#b45309', fontWeight: 'bold' }}>ЗАПИТ НА ЗМІНУ ТЕМИ</span>
                            <strong style={{ fontSize: '1.1rem' }}>{p.proposedTitle}</strong>
                          </div>
                          <button onClick={() => approveTitleChange(p.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Дозволити зміну</button>
                        </div>
                      )}

                      {/* GitHub Link */}
                      {p.githubUrl && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Репозиторій коду</h5>
                          <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500, transition: 'all 0.2s' }} className="hover-scale">
                            <Github size={18} /> Відкрити GitHub
                          </a>
                        </div>
                      )}

                      {/* Публікації */}
                      <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: p.requiresPublication ? '1rem' : '0' }}>
                          <input 
                            type="checkbox" 
                            id={`pub-${p.id}`} 
                            checked={p.requiresPublication} 
                            onChange={() => togglePublication(p.id)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <label htmlFor={`pub-${p.id}`} style={{ fontWeight: 600, cursor: 'pointer' }}>Вимагати наявність публікацій</label>
                        </div>
                        
                        {p.requiresPublication && (
                          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)' }}>
                            <h5 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Додані публікації:</h5>
                            {p.publications ? (
                              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '6px', whiteSpace: 'pre-wrap', fontSize: '0.9rem', borderLeft: '3px solid var(--primary-color)' }}>
                                {p.publications}
                              </div>
                            ) : (
                              <div style={{ padding: '1rem', color: 'var(--danger-color)', fontStyle: 'italic', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px' }}>
                                Студент ще не додав інформацію про публікації.
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Завантажені документи */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Завантажені документи</h5>
                        {(!p.documents || p.documents.length === 0) ? (
                          <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                            Студент ще не завантажив жодного файлу.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {p.documents.map((doc: any, idx: number) => (
                              <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <FileText size={20} color="var(--primary-color)" />
                                  <div>
                                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{doc.fileName}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                      {new Date(doc.createdAt).toLocaleString('uk-UA')} 
                                      {idx === 0 && <span style={{ marginLeft: '0.5rem', background: 'var(--success-color)', color: 'white', padding: '1px 5px', borderRadius: '4px', fontSize: '0.65rem' }}>НАЙНОВІША ВЕРСІЯ</span>}
                                    </div>
                                  </div>
                                </div>
                                <a href={`http://localhost:3001${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <FileDown size={16} /> Завантажити
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Розділи */}
                      <div>
                        <h5 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Прогрес розділів</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                          {p.chapters.sort((a: any, b: any) => a.order - b.order).map((c: any) => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                              <span style={{ fontWeight: 500 }}>{c.title}</span>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {c.status === 'PENDING' && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Не розпочато</span>}
                                {c.status === 'REWORK' && <span style={{ fontSize: '0.85rem', color: 'var(--danger-color)' }}>Доопрацьовує</span>}
                                {c.status === 'APPROVED' && <span style={{ fontSize: '0.85rem', color: 'var(--success-color)' }}>Затверджено</span>}
                                
                                {c.status === 'SUBMITTED' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#f59e0b', marginRight: '0.5rem', fontWeight: 500 }}>На перевірці</span>
                                    <button onClick={() => approveChapter(c.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', background: 'var(--success-color)' }} title="Схвалити"><CheckCircle size={16} /></button>
                                    <button onClick={() => reworkChapter(c.id)} className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }} title="На доопрацювання"><RefreshCw size={16} /></button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Архів / Виконані роботи */}
        {completedProjects.length > 0 && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div 
              onClick={() => setArchiveExpanded(!archiveExpanded)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <h3 style={{ margin: 0 }}>Архів / Виконані роботи ({completedProjects.length})</h3>
              {archiveExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>

            {archiveExpanded && (
              <div style={{ marginTop: '1.5rem' }}>
                {filteredCompleted.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Немає виконаних робіт, що відповідають пошуку.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredCompleted.map(p => (
                      <div key={p.id} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', opacity: 0.85 }}>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedProjectId(expandedProjectId === p.id ? null : p.id);
                          }}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', cursor: 'pointer', transition: 'background 0.2s', background: expandedProjectId === p.id ? 'rgba(0,0,0,0.02)' : 'transparent' }}
                        >
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Виконано</div>
                            <h4 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{p.student.name} {p.student.group ? `(${p.student.group})` : ''}</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', textDecoration: 'line-through' }}>{p.title}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>ВИКОНАНО</span>
                            {expandedProjectId === p.id ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
                          </div>
                        </div>

                        {expandedProjectId === p.id && (
                          <div style={{ padding: '1.5rem', borderTop: '1px dashed var(--border-color)', background: 'var(--bg-color)' }}>
                            {/* GitHub Link */}
                            {p.githubUrl && (
                              <div style={{ marginBottom: '1.5rem' }}>
                                <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Репозиторій коду</h5>
                                <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500, transition: 'all 0.2s' }} className="hover-scale">
                                  <Github size={18} /> Відкрити GitHub
                                </a>
                              </div>
                            )}

                            {/* Публікації */}
                            {p.requiresPublication && p.publications && (
                              <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <h5 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Публікації:</h5>
                                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '6px', whiteSpace: 'pre-wrap', fontSize: '0.9rem', borderLeft: '3px solid var(--success-color)' }}>
                                  {p.publications}
                                </div>
                              </div>
                            )}

                            {/* Завантажені документи */}
                            <div style={{ marginBottom: '1.5rem' }}>
                              <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Завантажені документи</h5>
                              {(!p.documents || p.documents.length === 0) ? (
                                <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                                  Студент не завантажував файлів.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {p.documents.map((doc: any, idx: number) => (
                                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <FileText size={20} color="var(--primary-color)" />
                                        <div>
                                          <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{doc.fileName}</div>
                                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {new Date(doc.createdAt).toLocaleString('uk-UA')} 
                                          </div>
                                        </div>
                                      </div>
                                      <a href={`http://localhost:3001${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <FileDown size={16} /> Завантажити
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Розділи */}
                            <div>
                              <h5 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Прогрес розділів</h5>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                {p.chapters.sort((a: any, b: any) => a.order - b.order).map((c: any) => (
                                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                    <span style={{ fontWeight: 500 }}>{c.title}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                      {c.status === 'APPROVED' ? (
                                        <span style={{ fontSize: '0.85rem', color: 'var(--success-color)' }}>Затверджено</span>
                                      ) : (
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.status === 'SUBMITTED' ? 'На перевірці' : c.status === 'REWORK' ? 'На доопрацюванні' : 'Не розпочато'}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
