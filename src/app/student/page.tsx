'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle, Clock, AlertCircle, Edit3, Send, Github, FileUp, FileText } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]); // plural
  const [teachers, setTeachers] = useState<any[]>([]);

  // Form states
  const [title, setTitle] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [proposedTitle, setProposedTitle] = useState('');
  const [availablePools, setAvailablePools] = useState<any[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'STUDENT') {
      router.push('/login');
      return;
    }
    setUser(parsedUser);
    fetchData(parsedUser.id);

    // Автооновлення кожні 10 секунд (без спінера)
    const interval = setInterval(() => {
      fetchData(parsedUser.id, false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async (userId: string, showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const projRes = await fetch(`http://localhost:3001/api/projects?userId=${userId}&role=STUDENT`);
      const projData = await projRes.json();
      setProjects(projData);

      const poolsRes = await fetch(`http://localhost:3001/api/student/pools?studentId=${userId}`);
      const poolsData = await poolsRes.json();
      setAvailablePools(poolsData);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchTeachersInPool = async (poolId: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/student/pools/${poolId}/teachers`);
      const data = await res.json();
      setTeachers(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const isProject = projects.some(p => p.id === selectedPoolId);
    if (selectedPoolId && !isProject && !projects.find(p => p.poolId === selectedPoolId)) {
      fetchTeachersInPool(selectedPoolId);
    }
  }, [selectedPoolId, projects]);

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('http://localhost:3001/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: user.id,
        title,
        teacherId: selectedTeacher.id,
        poolId: selectedPoolId
      }),
    });
    setSelectedTeacher(null);
    setTitle('');
    fetchData(user.id);
  };

  const requestTitleChange = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    await fetch(`http://localhost:3001/api/projects/${projectId}/change-title`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposedTitle }),
    });
    setProposedTitle('');
    fetchData(user.id);
  };

  const submitChapter = async (chapterId: string) => {
    await fetch(`http://localhost:3001/api/chapters/${chapterId}/submit`, { method: 'POST' });
    fetchData(user.id);
  };

  const updateGithubUrl = async (projectId: string, url: string) => {
    await fetch(`http://localhost:3001/api/projects/${projectId}/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ githubUrl: url }),
    });
    fetchData(user.id);
  };

  const updatePublications = async (projectId: string, text: string) => {
    await fetch(`http://localhost:3001/api/projects/${projectId}/publications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publications: text }),
    });
    fetchData(user.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    try {
      await fetch('http://localhost:3001/upload/document', {
        method: 'POST',
        body: formData,
      });
      fetchData(user.id);
    } catch (e) {
      console.error('Upload failed', e);
    }
  };



  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Завантаження...</div>;

  const completedProjects = projects.filter(p => p.status === 'COMPLETED');

  return (
    <div className="container" style={{ paddingTop: '5vh', paddingBottom: '5vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Кабінет Студента</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{user?.name}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Плитки завдань (Пулів) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {availablePools.map(pool => {
            const project = projects.find(p => p.poolId === pool.id);
            const isSelected = selectedPoolId === pool.id;

            return (
              <div
                key={pool.id}
                onClick={() => setSelectedPoolId(pool.id)}
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(46, 125, 50, 0.05)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? '0 8px 24px rgba(46, 125, 50, 0.1)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {project && (
                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--success-color)', color: 'white', fontWeight: 600 }}>АКТИВНО</span>
                  )}
                </div>
                <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{pool.name}</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{pool.year} • {pool.semester}</div>
              </div>
            );
          })}

          {completedProjects.map(project => {
            const isSelected = selectedPoolId === project.id;

            return (
              <div
                key={project.id}
                onClick={() => setSelectedPoolId(project.id)}
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  border: isSelected ? '2px solid var(--success-color)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? '0 8px 24px rgba(16, 185, 129, 0.1)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Виконана робота</span>
                  <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--success-color)', color: 'white', fontWeight: 600 }}>ВИКОНАНО / АРХІВ</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{project.title}</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Керівник: {project.teacher.name}</div>
              </div>
            );
          })}
        </div>

        {/* Деталі обраного завдання */}
        {!selectedPoolId ? (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', border: '2px dashed var(--border-color)', background: 'transparent' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Оберіть завдання зі списку вище, щоб переглянути деталі або статус</div>
          </div>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {(() => {
              const project = projects.find(p => p.poolId === selectedPoolId || p.id === selectedPoolId);
              const pool = availablePools.find(p => p.id === selectedPoolId);

              if (!project) {
                // Форма вибору керівника
                return (
                  <div className="glass-panel" style={{ padding: '2.5rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Вибір керівника</h3>
                      <p style={{ color: 'var(--text-secondary)' }}>Для початку роботи над "{pool?.name}" необхідно обрати керівника та запропонувати тему.</p>
                    </div>

                    {!selectedTeacher ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {teachers.map(t => {
                          const isFull = t.used >= t.capacity;
                          return (
                            <div key={t.id} style={{
                              padding: '1.5rem',
                              borderRadius: '12px',
                              border: `1px solid ${isFull ? 'var(--border-color)' : 'var(--primary-color)'}`,
                              background: isFull ? 'rgba(0,0,0,0.02)' : 'var(--bg-secondary)',
                              opacity: isFull ? 0.6 : 1,
                              cursor: isFull ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s'
                            }} onClick={() => !isFull && setSelectedTeacher(t)}>
                              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t.name}</h4>
                              <div style={{ color: isFull ? 'var(--danger-color)' : 'var(--success-color)', fontSize: '0.85rem', fontWeight: 600 }}>
                                Вільних місць: {t.capacity - t.used} / {t.capacity}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <button onClick={() => setSelectedTeacher(null)} className="btn" style={{ background: 'transparent', marginBottom: '1.5rem', padding: 0, color: 'var(--text-secondary)' }}>← Назад до списку викладачів</button>
                        <form onSubmit={createRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <div style={{ background: 'rgba(46, 125, 50, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(46, 125, 50, 0.1)' }}>
                            Обраний керівник: <strong style={{ color: 'var(--primary-color)' }}>{selectedTeacher.name}</strong>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Тема вашої роботи</label>
                            <input required type="text" className="input-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="Введіть повну назву теми..." style={{ padding: '0.8rem 1rem' }} />
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem' }}>Відправити запит керівнику</button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              } else {
                // Статус активного проєкту
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '2.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            <Clock size={16} />
                            <span>Статус проєкту: <strong>{project.status === 'PENDING' ? 'Очікує підтвердження' : project.status === 'REJECTED' ? 'Відхилено' : project.status === 'COMPLETED' ? 'Виконано / В архіві' : 'Затверджено'}</strong></span>
                          </div>
                          <h3 style={{ fontSize: '1.8rem', color: 'var(--primary-color)', margin: '0.5rem 0' }}>{project.title}</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Керівник: <strong>{project.teacher.name}</strong></p>
                        </div>
                        <div style={{ 
                          padding: '0.6rem 1.2rem', 
                          borderRadius: '999px', 
                          background: project.status === 'APPROVED' ? 'rgba(46,125,50,0.1)' : project.status === 'COMPLETED' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', 
                          color: project.status === 'APPROVED' ? 'var(--success-color)' : project.status === 'COMPLETED' ? '#3b82f6' : '#b45309', 
                          fontWeight: 700, 
                          fontSize: '0.9rem' 
                        }}>
                          {project.status === 'PENDING' ? 'В ОБРОБЦІ' : project.status === 'REJECTED' ? 'ВІДХИЛЕНО' : project.status === 'COMPLETED' ? 'ВИКОНАНО' : 'ЗАТВЕРДЖЕНО'}
                        </div>
                      </div>

                      {project.status === 'APPROVED' && (
                        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                          <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Зміна теми</h4>
                          {project.proposedTitle ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(245,158,11,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)' }}>
                              <Clock size={18} color="#b45309" />
                              <span style={{ fontSize: '0.95rem' }}>Ви запропонували нову тему: <strong>{project.proposedTitle}</strong>. Очікуйте на рішення керівника.</span>
                            </div>
                          ) : (
                            <form onSubmit={(e) => requestTitleChange(e, project.id)} style={{ display: 'flex', gap: '1rem' }}>
                              <input required type="text" className="input-control" value={proposedTitle} onChange={e => setProposedTitle(e.target.value)} placeholder="Введіть нову назву теми..." />
                              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Подати запит</button>
                            </form>
                          )}
                        </div>
                      )}

                      {project.status === 'APPROVED' && (
                        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                          <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Github size={18} /> Репозиторій коду (GitHub)</h4>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const url = (e.target as any).elements.githubUrl.value;
                            updateGithubUrl(project.id, url);
                          }} style={{ display: 'flex', gap: '1rem' }}>
                            <input name="githubUrl" type="url" className="input-control" defaultValue={project.githubUrl || ''} placeholder="https://github.com/посилання" style={{ flex: 1 }} />
                            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Зберегти</button>
                          </form>
                        </div>
                      )}

                      {/* Публікації */}
                      {project.status === 'APPROVED' && project.requiresPublication && (
                        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                          <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookOpen size={18} /> Наукові публікації</h4>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Ваш керівник вимагає додати інформацію про наукові публікації (наприклад, тези на конференцію). Введіть бібліографічний опис або посилання нижче:
                          </p>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const text = (e.target as any).elements.publications.value;
                            updatePublications(project.id, text);
                          }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <textarea 
                              name="publications" 
                              className="input-control" 
                              rows={4}
                              defaultValue={project.publications || ''} 
                              placeholder="Гарпуль Ю. В. Назва статті // Матеріали конференції..." 
                              style={{ resize: 'vertical' }}
                            ></textarea>
                            <div style={{ alignSelf: 'flex-end' }}>
                              <button type="submit" className="btn btn-primary">Зберегти публікації</button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>

                    {/* Завантаження документів */}
                    {(project.status === 'APPROVED' || project.status === 'COMPLETED') && (
                      <div className="glass-panel" style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                          <h3 style={{ margin: 0 }}>Файли роботи (PDF)</h3>
                          {project.status === 'APPROVED' && (
                            <div>
                              <input 
                                type="file" 
                                id={`file-upload-${project.id}`} 
                                style={{ display: 'none' }} 
                                accept=".pdf" 
                                onChange={(e) => handleFileUpload(e, project.id)} 
                              />
                              <button 
                                className="btn btn-primary" 
                                onClick={() => document.getElementById(`file-upload-${project.id}`)?.click()}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                              >
                                <FileUp size={18} /> Завантажити нову версію
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {(!project.documents || project.documents.length === 0) ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                              Ви ще не завантажили жодного файлу.
                            </div>
                          ) : (
                            project.documents.map((doc: any, idx: number) => (
                              <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  <FileText size={24} color="var(--primary-color)" />
                                  <div>
                                    <div style={{ fontWeight: 500 }}>{doc.fileName}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(doc.createdAt).toLocaleString('uk-UA')} {idx === 0 && <span style={{ marginLeft: '0.5rem', background: 'var(--success-color)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>НАЙНОВІША</span>}</div>
                                  </div>
                                </div>
                                <a href={`http://localhost:3001${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Переглянути</a>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Прогрес по розділах */}
                    {(project.status === 'APPROVED' || project.status === 'COMPLETED') && project.chapters && (
                      <div className="glass-panel" style={{ padding: '2.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Етапи виконання</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {project.chapters.sort((a: any, b: any) => a.order - b.order).map((chapter: any) => (
                            <div key={chapter.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: chapter.status === 'APPROVED' ? 'var(--success-color)' : 'rgba(0,0,0,0.05)',
                                  color: chapter.status === 'APPROVED' ? 'white' : 'inherit',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700
                                }}>
                                  {chapter.status === 'APPROVED' ? <CheckCircle size={20} /> : chapter.order}
                                </div>
                                <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{chapter.title}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <span style={{
                                  fontSize: '0.9rem',
                                  fontWeight: 600,
                                  color: chapter.status === 'SUBMITTED' ? '#f59e0b' : chapter.status === 'REWORK' ? 'var(--danger-color)' : 'var(--text-secondary)'
                                }}>
                                  {chapter.status === 'PENDING' && 'НЕ РОЗПОЧАТО'}
                                  {chapter.status === 'SUBMITTED' && 'НА ПЕРЕВІРЦІ'}
                                  {chapter.status === 'REWORK' && 'ПОТРЕБУЄ ДООПРАЦЮВАННЯ'}
                                  {chapter.status === 'APPROVED' && 'ЗАТВЕРДЖЕНО'}
                                </span>
                                {(chapter.status === 'PENDING' || chapter.status === 'REWORK') && project.status === 'APPROVED' && (
                                  <button onClick={() => submitChapter(chapter.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                    <Send size={16} style={{ marginRight: '6px' }} /> Надіслати
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
