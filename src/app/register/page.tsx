'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Loader2, UserPlus, Users, LayoutList } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Витягуємо курс з назви групи (наприклад, з "ІПЗ-41" -> "4")
    const courseMatch = group.match(/-(\d)/);
    const computedCourse = courseMatch ? courseMatch[1] : '';

    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, group, course: computedCourse }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Помилка при реєстрації');
      }

      const user = await res.json();
      localStorage.setItem('user', JSON.stringify(user));
      router.push('/student');
    } catch (err: any) {
      setError(err.message || 'Сталася помилка при реєстрації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(46, 125, 50, 0.1)', padding: '1rem', borderRadius: '50%' }}>
              <UserPlus size={48} color="var(--primary-color)" />
            </div>
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Реєстрація Студента</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Створіть акаунт, щоб обрати керівника та тему</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ПІБ</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" className="input-control" style={{ paddingLeft: '2.5rem' }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Петренко Іван Іванович" required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Група</label>
            <div style={{ position: 'relative' }}>
              <Users size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" className="input-control" style={{ paddingLeft: '2.5rem' }} value={group} onChange={(e) => setGroup(e.target.value)} placeholder="напр. ІПЗ-41" required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="email" className="input-control" style={{ paddingLeft: '2.5rem' }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ваша@пошта.com" required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Пароль</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="password" className="input-control" style={{ paddingLeft: '2.5rem' }} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', width: '100%' }}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={18} style={{ marginRight: '8px' }} /> Зареєструватися</>}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Вже маєте акаунт? <Link href="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}>Увійдіть</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
