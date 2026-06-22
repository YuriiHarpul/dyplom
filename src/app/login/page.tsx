'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, LogIn, Loader2, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Якщо вже залогований — одразу перенаправити
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === 'ADMIN') router.replace('/admin');
        else if (user.role === 'TEACHER') router.replace('/teacher');
        else router.replace('/student');
      } catch {
        sessionStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Невірний email або пароль');
      }

      const user = await res.json();

      // Save to localStorage for demo purposes
      sessionStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'TEACHER') router.push('/teacher');
      else router.push('/student');
    } catch (err: any) {
      setError(err.message || 'Сталася помилка при вході');
    } finally {
      setLoading(false);
    }
  };

  // Quick login helpers for testing
  const quickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <main className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(46, 125, 50, 0.1)', padding: '1rem', borderRadius: '50%' }}>
              <UserCircle size={48} color="var(--primary-color)" />
            </div>
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Вхід у систему</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Увійдіть для доступу до кабінету</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="email"
                className="input-control"
                style={{ paddingLeft: '2.5rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ваша@пошта.com"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Пароль</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="password"
                className="input-control"
                style={{ paddingLeft: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', width: '100%' }}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><LogIn size={18} style={{ marginRight: '8px' }} /> Увійти</>}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <Link href="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}>Реєстрація(тест)</Link>
          </p>
        </div>

        <div style={{ marginTop: '2rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>Для тестування (швидкий вхід):</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button type="button" onClick={() => quickLogin('student@cnu.edu.ua')} className="btn" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', padding: '0.5rem', fontSize: '0.85rem' }}>👤 Зайти як Студент</button>
            <button type="button" onClick={() => quickLogin('teacher@cnu.edu.ua')} className="btn" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', padding: '0.5rem', fontSize: '0.85rem' }}>👨‍🏫 Зайти як Викладач</button>
            <button type="button" onClick={() => quickLogin('admin@cnu.edu.ua')} className="btn" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', padding: '0.5rem', fontSize: '0.85rem' }}>🛡️ Зайти як Адмін</button>
          </div>
        </div>
      </div>
    </main>
  );
}
