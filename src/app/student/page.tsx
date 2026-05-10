'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle, Clock, AlertCircle, Edit3, Send } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  // Form states
  const [title, setTitle] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [proposedTitle, setProposedTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
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
  }, []);

  const fetchData = async (userId: string) => {
    setLoading(true);
    try {
      const projRes = await fetch(`http://localhost:3001/api/projects?userId=${userId}&role=STUDENT`);
      const projText = await projRes.text();
      const projData = projText ? JSON.parse(projText) : null;
      setProject(projData);

      if (!projData) {
        const teachRes = await fetch('http://localhost:3001/api/users?role=TEACHER');
        const teachData = await teachRes.json();
        setTeachers(teachData);
        if (teachData.length > 0) {
          // No auto-selection, user will choose manually from the list
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('http://localhost:3001/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: user.id, title, teacherId: selectedTeacher.id }),
    });
    fetchData(user.id);
  };

  const requestTitleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    await fetch(`http://localhost:3001/api/projects/${project.id}/change-title`, {
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



  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Завантаження...</div>;

  return (
    <div className="container" style={{ paddingTop: '5vh', paddingBottom: '5vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Кабінет Студента</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{user?.name}</span>
        </div>
      </div>

      {!project ? (
        !selectedTeacher ? (
          <div className="glass-panel" style={{ padding: '2rem', margin: '0 auto' }}>
            <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Оберіть керівника дипломної роботи</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {teachers.map(t => {
                const used = t._count?.teacherProjects || 0;
                const max = t.capacity || 5;
                const available = Math.max(0, max - used);
                const isFull = available <= 0;

                return (
                  <div key={t.id} style={{
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: `1px solid ${isFull ? 'var(--border-color)' : 'var(--primary-color)'}`,
                    background: isFull ? 'rgba(0,0,0,0.02)' : 'var(--bg-secondary)',
                    opacity: isFull ? 0.6 : 1,
                    cursor: isFull ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }} onClick={() => !isFull && setSelectedTeacher(t)}>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{t.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isFull ? 'var(--danger-color)' : 'var(--success-color)', fontSize: '0.9rem', fontWeight: 500 }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: isFull ? 'var(--danger-color)' : 'var(--success-color)' }}></span>
                      Вільних місць: {available} / {max}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <button type="button" onClick={() => setSelectedTeacher(null)} className="btn" style={{ background: 'transparent', padding: '0', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              ← Змінити керівника
            </button>
            <h3 style={{ marginBottom: '1.5rem' }}>Подати запит на тему дипломної</h3>
            
            <div style={{ background: 'rgba(46, 125, 50, 0.05)', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(46, 125, 50, 0.1)' }}>
              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Обраний керівник:</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary-color)' }}>{selectedTeacher.name}</strong>
            </div>

            <form onSubmit={createRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Тема роботи</label>
                <input required type="text" className="input-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="Введіть тему..." />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Відправити запит</button>
            </form>
          </div>
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Інформація про проєкт */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>{project.title}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Керівник: {project.teacher.name}</p>
              </div>
              <div style={{ padding: '0.5rem 1rem', borderRadius: '999px', background: project.status === 'APPROVED' ? 'rgba(46,125,50,0.1)' : 'rgba(239,68,68,0.1)', color: project.status === 'APPROVED' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                {project.status === 'PENDING' ? 'Очікує затвердження керівником' : project.status === 'REJECTED' ? 'Відхилено' : 'Затверджено'}
              </div>
            </div>

            {project.status === 'APPROVED' && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h4>Запит на зміну теми</h4>
                {project.proposedTitle ? (
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}><Clock size={16} style={{ display: 'inline', marginRight: '4px' }}/> Ви подали запит на зміну теми на: <strong>{project.proposedTitle}</strong>. Очікуйте підтвердження.</p>
                ) : (
                  <form onSubmit={requestTitleChange} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <input required type="text" className="input-control" value={proposedTitle} onChange={e => setProposedTitle(e.target.value)} placeholder="Введіть нову тему..." />
                    <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Надіслати запит</button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Розділи */}
          {project.status === 'APPROVED' && project.chapters && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Прогрес виконання (Розділи)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {project.chapters.sort((a: any, b: any) => a.order - b.order).map((chapter: any) => (
                  <div key={chapter.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {chapter.order}
                      </div>
                      <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{chapter.title}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      {chapter.status === 'PENDING' && <span style={{ color: 'var(--text-secondary)' }}>Не розпочато</span>}
                      {chapter.status === 'SUBMITTED' && <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={16}/> На перевірці</span>}
                      {chapter.status === 'REWORK' && <span style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={16}/> Доопрацювання</span>}
                      {chapter.status === 'APPROVED' && <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={16}/> Затверджено</span>}

                      {(chapter.status === 'PENDING' || chapter.status === 'REWORK') && (
                        <button onClick={() => submitChapter(chapter.id)} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                          <Send size={16} style={{ marginRight: '6px' }}/> Відправити на перевірку
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
