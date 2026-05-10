'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, LayoutDashboard, LogOut, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Listen for changes or just check on mount/pathname change
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, [pathname]);

  if (pathname === '/login') return null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'TEACHER') return '/teacher';
    return '/student';
  };

  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '1rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href={user ? getDashboardLink() : '/'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-primary)' }}>
          <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.4rem', borderRadius: '8px' }}>
            <GraduationCap size={20} />
          </div>
          <span style={{ fontWeight: 600, fontSize: '1.2rem' }}>Система Моніторингу КНУВС</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            textDecoration: 'none',
            color: pathname === '/' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: pathname === '/' ? 600 : 400
          }}>
            <Search size={18} />
            Моніторинг (Пошук)
          </Link>

          {user ? (
            <>
              <Link href={getDashboardLink()} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                textDecoration: 'none',
                color: pathname.includes(user.role.toLowerCase()) ? 'var(--primary-color)' : 'var(--text-secondary)',
                fontWeight: pathname.includes(user.role.toLowerCase()) ? 600 : 400
              }}>
                <LayoutDashboard size={18} />
                Мій Кабінет
              </Link>
              <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }}></div>
              <button onClick={handleLogout} style={{
                background: 'transparent', border: 'none',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                color: 'var(--danger-color)', cursor: 'pointer', fontSize: '1rem'
              }}>
                <LogOut size={18} />
                Вийти
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>
              Увійти
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
