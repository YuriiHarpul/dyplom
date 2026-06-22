'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileType, CheckCircle, AlertTriangle, Loader2, Users, Search, Edit2, Layers, Plus, Trash2, X } from "lucide-react";
import { calculateSearchScore } from "@/utils/search";

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [usersList, setUsersList] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [teachersList, setTeachersList] = useState<any[]>([]);

    const [poolsList, setPoolsList] = useState<any[]>([]);
    const [loadingPools, setLoadingPools] = useState(true);
    
    const [importsList, setImportsList] = useState<any[]>([]);
    const [loadingImports, setLoadingImports] = useState(true);
    const [newPoolName, setNewPoolName] = useState("");
    const [newPoolYear, setNewPoolYear] = useState(new Date().getFullYear());
    const [newPoolSemester, setNewPoolSemester] = useState("1 семестр");
    const [newPoolWorkType, setNewPoolWorkType] = useState("Дипломна робота");
    const [newPoolPattern, setNewPoolPattern] = useState("");
    const [activePoolId, setActivePoolId] = useState<string | null>(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState("");
    const [teacherCapacity, setTeacherCapacity] = useState<number>(5);
    const [teacherSearchInPool, setTeacherSearchInPool] = useState("");

    const [activeTab, setActiveTab] = useState<'USERS' | 'POOLS' | 'UPLOAD'>('USERS');
    const [groupFilter, setGroupFilter] = useState("");
    const [teacherFilter, setTeacherFilter] = useState("");
    const [poolGroupFilter, setPoolGroupFilter] = useState("");

    const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
    const [searchIndex, setSearchIndex] = useState(-1);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const [localCapacities, setLocalCapacities] = useState<Record<string, string>>({});
    const [deletingPoolId, setDeletingPoolId] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'ADMIN') {
            router.push('/login');
            return;
        }
        setUser(parsedUser);
        fetchUsers();
        fetchPools();
        fetchImports();

        // Автооновлення кожні 10 секунд
        const interval = setInterval(() => {
            fetchUsers(false);
            fetchPools(false);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const fetchImports = async () => {
        setLoadingImports(true);
        try {
            const res = await fetch('http://localhost:3001/api/admin/imports');
            if (res.ok) {
                const data = await res.json();
                setImportsList(data);
            }
        } catch (e) { console.error(e); }
        finally { setLoadingImports(false); }
    };

    const fetchUsers = async (showLoader = true) => {
        if (showLoader) setLoadingUsers(true);
        try {
            const res = await fetch('http://localhost:3001/api/users');
            const data = await res.json();
            setUsersList(data);
            setTeachersList(data.filter((u: any) => u.role === 'TEACHER'));
        } catch (e) {
            console.error(e);
        } finally {
            if (showLoader) setLoadingUsers(false);
        }
    };

    const fetchPools = async (showLoader = true) => {
        if (showLoader) setLoadingPools(true);
        try {
            const res = await fetch('http://localhost:3001/api/admin/pools');
            if (res.ok) {
                const data = await res.json();
                setPoolsList(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (showLoader) setLoadingPools(false);
        }
    };

    const handleCreatePool = async () => {
        if (!newPoolName || !newPoolPattern) return;
        try {
            const res = await fetch('http://localhost:3001/api/admin/pools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPoolName,
                    year: newPoolYear,
                    semester: newPoolSemester,
                    workType: newPoolWorkType,
                    groupPatterns: newPoolPattern
                })
            });
            if (res.ok) {
                setNewPoolName("");
                setNewPoolPattern("");
                fetchPools();
            }
        } catch (e) { console.error(e); }
    };

    const handleDeletePool = async (poolId: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/admin/pools/${poolId}`, { method: 'DELETE' });
            if (res.ok) fetchPools();
        } catch (e) { console.error(e); }
    };

    const handleAddTeachersToPool = async (poolId: string) => {
        if (selectedTeacherIds.length === 0) return;
        try {
            await Promise.all(selectedTeacherIds.map(tId => 
                fetch(`http://localhost:3001/api/admin/pools/${poolId}/teachers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teacherId: tId, capacity: teacherCapacity })
                })
            ));
            setSelectedTeacherIds([]);
            setTeacherSearchInPool("");
            setActivePoolId(null);
            fetchPools();
        } catch (e) { console.error(e); }
    };

    const toggleTeacherSelection = (teacherId: string) => {
        setSelectedTeacherIds(prev => 
            prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId]
        );
    };

    const handleRemoveTeacherFromPool = async (poolId: string, teacherId: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/admin/pools/${poolId}/teachers/${teacherId}`, { method: 'DELETE' });
            if (res.ok) fetchPools();
        } catch (e) { console.error(e); }
    };

    const handleUpdateTeacherCapacity = async (poolId: string, teacherId: string, capacity: number) => {
        try {
            const res = await fetch(`http://localhost:3001/api/admin/pools/${poolId}/teachers/${teacherId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ capacity })
            });
            if (res.ok) {
                setPoolsList(prev => prev.map(pool => {
                    if (pool.id === poolId) {
                        return {
                            ...pool,
                            teachers: pool.teachers.map((pt: any) => 
                                pt.teacher.id === teacherId ? { ...pt, capacity } : pt
                            )
                        };
                    }
                    return pool;
                }));
            }
        } catch (e) { console.error(e); }
    };



    const handleAssignTeacher = async (studentId: string, teacherId: string) => {
        if (!teacherId) return;
        try {
            const res = await fetch('http://localhost:3001/api/admin/assign-teacher', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, teacherId }),
            });
            if (res.ok) {
                alert('Керівника успішно змінено!');
                fetchUsers();
            }
        } catch (e) {
            console.error(e);
            alert('Помилка при зміні керівника');
        }
    };

    const handleChangeRole = async (userId: string, newRole: string) => {
        try {
            const res = await fetch('http://localhost:3001/api/admin/change-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newRole }),
            });
            if (res.ok) {
                alert('Роль успішно змінено!');
                fetchUsers();
            }
        } catch (e) {
            console.error(e);
            alert('Помилка при зміні ролі');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".pdf"))) {
            setFile(droppedFile);
            setMessage(null);
        } else {
            setMessage({ type: "error", text: "Підтримуються лише формати .xlsx та .pdf" });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setMessage(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("http://localhost:3001/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: `Успішно імпортовано ${data.count} проєктів з БД!` });
                setFile(null);
                fetchUsers(); // Оновити список юзерів
                fetchImports();
            } else {
                setMessage({ type: "error", text: data.error || "Помилка при завантаженні файлу" });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Внутрішня помилка сервера при завантаженні" });
        } finally {
            setIsUploading(false);
        }
    };



    const handleDeleteImport = async (id: string) => {
        if (!confirm("Ви впевнені, що хочете видалити цей файл з історії? Це не видалить вже створених студентів чи викладачів.")) return;
        try {
            const res = await fetch(`http://localhost:3001/api/admin/imports/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                alert('Імпорт успішно видалено з історії!');
                fetchImports();
            } else {
                alert('Не вдалося видалити імпорт.');
            }
        } catch (e) {
            console.error(e);
            alert('Помилка при видаленні імпорту');
        }
    };

    const getFilteredUsers = () => {
        let list = usersList.filter(u => {
            const matchesGroup = !groupFilter || (u.group && u.group.toLowerCase().includes(groupFilter.toLowerCase()));
            const matchesTeacher = !teacherFilter || u.studentProjects?.some((p: any) => p.teacher?.name.toLowerCase().includes(teacherFilter.toLowerCase()));
            return matchesGroup && matchesTeacher;
        });

        if (searchQuery) {
            list = list
                .map(u => ({ u, score: calculateSearchScore(`${u.name} ${u.email} ${u.group || ""}`, searchQuery) }))
                .filter(res => res.score > 0)
                .map(res => res.u);
        }

        return list.sort((a, b) => {
            const rolePriority: Record<string, number> = { 'ADMIN': 1, 'TEACHER': 2, 'STUDENT': 3 };
            const priorityA = rolePriority[a.role] || 4;
            const priorityB = rolePriority[b.role] || 4;

            if (priorityA !== priorityB) return priorityA - priorityB;

            if (a.role === 'STUDENT' && b.role === 'STUDENT') {
                const courseA = parseInt(a.course) || 0;
                const courseB = parseInt(b.course) || 0;
                return courseB - courseA;
            }

            return 0;
        });
    };

    const filteredUsers = getFilteredUsers();

    const filteredTeachersForPool = teachersList.filter(t =>
        t.name.toLowerCase().includes(teacherSearchInPool.toLowerCase())
    );

    const filteredPools = poolsList.filter(pool => {
        if (!poolGroupFilter) return true;
        const patterns = pool.groupPatterns.split(',').map((p: string) => p.trim());
        return patterns.some((pattern: string) => {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            // Check if the filter (e.g. "ІПЗ-21") matches the pattern (e.g. "ІПЗ-2*")
            // OR if the pattern matches the filter prefix (e.g. filter "ІПЗ" matches pattern "ІПЗ-2*")
            return regex.test(poolGroupFilter) || pattern.toLowerCase().includes(poolGroupFilter.toLowerCase()) || poolGroupFilter.toLowerCase().includes(pattern.toLowerCase().replace('*', ''));
        });
    });

    if (!user) return null;

    return (
        <main className="container" style={{ paddingTop: "5vh", paddingBottom: "5vh" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Кабінет Адміністратора</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{user?.name}</span>
                </div>
            </div>

            {/* Вкладки (Tabs) */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <button
                    onClick={() => setActiveTab('USERS')}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: activeTab === 'USERS' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'USERS' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                >
                    Користувачі
                </button>
                <button
                    onClick={() => setActiveTab('POOLS')}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: activeTab === 'POOLS' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'POOLS' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                >
                    Роботи
                </button>
                <button
                    onClick={() => setActiveTab('UPLOAD')}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: activeTab === 'UPLOAD' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'UPLOAD' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                >
                    Імпорт БД
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Вкладка 1: Список користувачів */}
                {activeTab === 'USERS' && (
                    <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><Users size={24} /> Управління користувачами</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', flex: 1, maxWidth: '900px' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        className="input-control"
                                        placeholder="Ім'я / Email..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        style={{ paddingLeft: '2.2rem' }}
                                    />
                                </div>
                                <input
                                    type="text"
                                    className="input-control"
                                    placeholder="Фільтр за групою (напр. ІПЗ)..."
                                    value={groupFilter}
                                    onChange={e => setGroupFilter(e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="input-control"
                                    placeholder="Фільтр за керівником..."
                                    value={teacherFilter}
                                    onChange={e => setTeacherFilter(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Ім'я</th>
                                        <th>Email</th>
                                        <th>Роль</th>
                                        <th>Група</th>
                                        <th>Проєкти (Керівники)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingUsers ? (
                                        <tr><td colSpan={5} style={{ textAlign: 'center' }}>Завантаження...</td></tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Користувачів не знайдено</td></tr>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <tr key={u.id}>
                                                <td style={{ fontWeight: 500 }}>{u.name}</td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                                <td>
                                                    <select
                                                        className="input-control"
                                                        style={{
                                                            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', width: 'auto',
                                                            background: u.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.1)' : u.role === 'TEACHER' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                            color: u.role === 'ADMIN' ? 'var(--danger-color)' : u.role === 'TEACHER' ? '#3b82f6' : 'var(--success-color)',
                                                            border: 'none', cursor: 'pointer', fontWeight: 600
                                                        }}
                                                        value={u.role}
                                                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                                    >
                                                        <option value="STUDENT">STUDENT</option>
                                                        <option value="TEACHER">TEACHER</option>
                                                        <option value="ADMIN">ADMIN</option>
                                                    </select>
                                                </td>
                                                <td>{u.group || '-'}</td>
                                                <td>
                                                    {u.role === 'STUDENT' ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            {u.studentProjects?.map((p: any, idx: number) => (
                                                                <div key={p.pool?.name || idx} style={{ fontSize: '0.85rem', padding: '0.3rem', background: 'rgba(0,0,0,0.02)', borderRadius: '4px' }}>
                                                                    <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{p.pool?.name || 'Без пулу'}:</span> {p.teacher?.name || 'Не призначено'}
                                                                </div>
                                                            ))}
                                                            {(!u.studentProjects || u.studentProjects.length === 0) && (
                                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Немає активних проєктів</span>
                                                            )}
                                                            <select
                                                                className="input-control"
                                                                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: 'auto', marginTop: '0.2rem' }}
                                                                defaultValue=""
                                                                onChange={(e) => {
                                                                    if (e.target.value) handleAssignTeacher(u.id, e.target.value);
                                                                    e.target.value = '';
                                                                }}
                                                            >
                                                                <option value="">✏️ Змінити керівника...</option>
                                                                {teachersList.map((t: any) => (
                                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Вкладка 2: Управління пулами */}
                {activeTab === 'POOLS' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        
                        {/* Секція створення */}
                        <div className="glass-panel" style={{ padding: "2rem" }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}><Plus size={24} /> Створити нове завдання (пул)</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Назва пулу</label>
                                    <input type="text" className="input-control" placeholder="напр. Основний" value={newPoolName} onChange={e => setNewPoolName(e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Рік</label>
                                    <input type="number" className="input-control" value={newPoolYear} onChange={e => setNewPoolYear(parseInt(e.target.value) || new Date().getFullYear())} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Семестр</label>
                                    <select className="input-control" value={newPoolSemester} onChange={e => setNewPoolSemester(e.target.value)}>
                                        <option value="1 семестр">1 семестр</option>
                                        <option value="2 семестр">2 семестр</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Групи</label>
                                    <select className="input-control" value={newPoolPattern} onChange={e => setNewPoolPattern(e.target.value)}>
                                        <option value="">Оберіть курс...</option>
                                        <option value="ІПЗ-1*">ІПЗ-1 (1 курс)</option>
                                        <option value="ІПЗ-2*">ІПЗ-2 (2 курс)</option>
                                        <option value="ІПЗ-3*">ІПЗ-3 (3 курс)</option>
                                        <option value="ІПЗ-4*">ІПЗ-4 (4 курс)</option>
                                        <option value="ІПЗ(м)*">ІПЗ(м) (Магістратура)</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button className="btn btn-primary" onClick={handleCreatePool} disabled={!newPoolName || !newPoolPattern} style={{ width: '100%', height: '42px' }}>Створити</button>
                                </div>
                            </div>
                        </div>

                        {/* Секція списку та фільтрації */}
                        <div className="glass-panel" style={{ padding: "2rem" }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><Layers size={24} /> Список активних завдань</h3>
                                
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <Search size={18} color="var(--text-secondary)" />
                                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Фільтр за групою:</label>
                                    <select 
                                        className="input-control" 
                                        style={{ width: '180px', border: 'none', background: 'transparent', fontWeight: 600, color: 'var(--primary-color)' }}
                                        value={poolGroupFilter}
                                        onChange={e => setPoolGroupFilter(e.target.value)}
                                    >
                                        <option value="">Всі групи</option>
                                        <option value="ІПЗ-1">ІПЗ 1 курс</option>
                                        <option value="ІПЗ-2">ІПЗ 2 курс</option>
                                        <option value="ІПЗ-3">ІПЗ 3 курс</option>
                                        <option value="ІПЗ-4">ІПЗ 4 курс</option>
                                        <option value="ІПЗ(м)">ІПЗ Магістри</option>
                                    </select>
                                </div>
                            </div>

                            {loadingPools ? (
                                <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="animate-spin" /></div>
                            ) : filteredPools.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                                    Роботи не знайдено за обраним фільтром
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {filteredPools.map(pool => (
                                    <div key={pool.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', background: 'var(--bg-secondary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{pool.name} {pool.year} ({pool.semester})</h4>
                                                <p style={{ margin: '0.3rem 0', color: 'var(--text-secondary)' }}>Групи: {pool.groupPatterns}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                {deletingPoolId === pool.id ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--danger-color)', fontWeight: 600 }}>Видалити?</span>
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: 'var(--danger-color)', border: 'none', height: '30px', display: 'flex', alignItems: 'center' }}
                                                            onClick={() => { handleDeletePool(pool.id); setDeletingPoolId(null); }}
                                                        >
                                                            Так
                                                        </button>
                                                        <button
                                                            className="btn"
                                                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', height: '30px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                                                            onClick={() => setDeletingPoolId(null)}
                                                        >
                                                            Ні
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="btn"
                                                            style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                            onClick={() => { setActivePoolId(activePoolId === pool.id ? null : pool.id); setTeacherSearchInPool(""); }}
                                                        >
                                                            <Plus size={18} /> Додати викладача
                                                        </button>
                                                        <button
                                                            className="btn"
                                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}
                                                            onClick={() => setDeletingPoolId(pool.id)}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {activePoolId === pool.id && (
                                            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px dashed var(--primary-color)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Оберіть одного або декількох викладачів</label>
                                                        
                                                        {/* Chips for selected */}
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                            {selectedTeacherIds.map(id => {
                                                                const t = teachersList.find(x => x.id === id);
                                                                return (
                                                                    <div key={id} style={{ background: 'var(--primary-color)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                                        {t?.name}
                                                                        <X size={14} style={{ cursor: 'pointer' }} onClick={() => toggleTeacherSelection(id)} />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        <div style={{ position: 'relative' }}>
                                                            <input
                                                                type="text"
                                                                className="input-control"
                                                                placeholder="Почніть вводити прізвище або натисніть для списку..."
                                                                value={teacherSearchInPool}
                                                                onFocus={() => setShowDropdown(true)}
                                                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                                                onChange={e => { setTeacherSearchInPool(e.target.value); setSearchIndex(-1); setShowDropdown(true); }}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'ArrowDown') {
                                                                        setSearchIndex(prev => Math.min(prev + 1, filteredTeachersForPool.length - 1));
                                                                    } else if (e.key === 'ArrowUp') {
                                                                        setSearchIndex(prev => Math.max(prev - 1, 0));
                                                                    } else if (e.key === 'Enter' && searchIndex >= 0) {
                                                                        toggleTeacherSelection(filteredTeachersForPool[searchIndex].id);
                                                                        setTeacherSearchInPool("");
                                                                        setSearchIndex(-1);
                                                                    }
                                                                }}
                                                            />
                                                            {showDropdown && (
                                                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', maxHeight: '250px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                                    {filteredTeachersForPool.map((t, idx) => (
                                                                        <div
                                                                            key={t.id}
                                                                            onClick={() => { toggleTeacherSelection(t.id); setTeacherSearchInPool(""); setShowDropdown(false); }}
                                                                            style={{ 
                                                                                padding: '0.75rem 1rem', 
                                                                                cursor: 'pointer', 
                                                                                background: searchIndex === idx ? 'rgba(0,0,0,0.05)' : selectedTeacherIds.includes(t.id) ? 'rgba(46,125,50,0.1)' : 'transparent',
                                                                                borderLeft: selectedTeacherIds.includes(t.id) ? '4px solid var(--success-color)' : 'none'
                                                                            }}
                                                                        >
                                                                            {t.name}
                                                                        </div>
                                                                    ))}
                                                                    {filteredTeachersForPool.length === 0 && <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Нікого не знайдено</div>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                                        <div style={{ width: '150px' }}>
                                                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Ліміт (для всіх)</label>
                                                            <input type="number" min="1" className="input-control" value={teacherCapacity} onChange={e => setTeacherCapacity(parseInt(e.target.value) || 1)} />
                                                        </div>
                                                        <button className="btn btn-primary" onClick={() => handleAddTeachersToPool(pool.id)} disabled={selectedTeacherIds.length === 0}>
                                                            Додати обраних ({selectedTeacherIds.length})
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="table-container">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Викладач</th>
                                                        <th>Email</th>
                                                        <th style={{ width: '150px' }}>Ліміт (місць)</th>
                                                        <th style={{ width: '100px' }}>Дії</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pool.teachers?.map((pt: any) => (
                                                        <tr key={pt.id}>
                                                            <td style={{ fontWeight: 500 }}>{pt.teacher.name}</td>
                                                            <td style={{ color: 'var(--text-secondary)' }}>{pt.teacher.email}</td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    className="input-control"
                                                                    style={{ width: '80px', padding: '0.2rem 0.5rem', fontSize: '0.9rem' }}
                                                                    value={localCapacities[`${pool.id}-${pt.teacher.id}`] ?? pt.capacity}
                                                                    onChange={(e) => setLocalCapacities(prev => ({ ...prev, [`${pool.id}-${pt.teacher.id}`]: e.target.value }))}
                                                                    onBlur={(e) => {
                                                                        const val = parseInt(e.target.value);
                                                                        if (!isNaN(val)) handleUpdateTeacherCapacity(pool.id, pt.teacher.id, val);
                                                                        setLocalCapacities(prev => {
                                                                            const next = { ...prev };
                                                                            delete next[`${pool.id}-${pt.teacher.id}`];
                                                                            return next;
                                                                        });
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            (e.target as HTMLInputElement).blur();
                                                                        }
                                                                    }}
                                                                />
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <button className="btn" style={{ background: 'transparent', color: 'var(--danger-color)', padding: '0.25rem' }} onClick={() => handleRemoveTeacherFromPool(pool.id, pt.teacher.id)}>
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(!pool.teachers || pool.teachers.length === 0) && (
                                                        <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Викладачів ще не додано</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

                {/* Вкладка 3: Імпорт */}
                {activeTab === 'UPLOAD' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
                            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                                <h3>Імпорт бази дипломів (XLSX)</h3>
                                <p style={{ color: "var(--text-secondary)" }}>Автоматичне створення студентів, викладачів та проєктів з Excel файлу</p>
                            </div>

                            <div
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                style={{
                                    border: `2px dashed ${file ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                    borderRadius: "12px",
                                    padding: "3rem 2rem",
                                    textAlign: "center",
                                    backgroundColor: file ? "rgba(46, 125, 50, 0.05)" : "rgba(0,0,0,0.02)",
                                    transition: "all 0.3s ease",
                                    marginBottom: "2rem",
                                    cursor: "pointer"
                                }}
                                onClick={() => document.getElementById("file-upload")?.click()}
                            >
                                <input type="file" id="file-upload" style={{ display: "none" }} accept=".xlsx,.pdf" onChange={handleFileChange} />
                                {file ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                                        <FileType size={48} color="var(--primary-color)" />
                                        <div>
                                            <strong style={{ fontSize: "1.2rem", display: "block" }}>{file.name}</strong>
                                            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{(file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "var(--text-secondary)" }}>
                                        <UploadCloud size={48} />
                                        <div><strong style={{ fontSize: "1.1rem", display: "block", color: "var(--text-primary)" }}>Перетягніть файл сюди</strong><span>або натисніть для вибору</span></div>
                                    </div>
                                )}
                            </div>

                            {message && (
                                <div style={{ padding: "1rem 1.5rem", borderRadius: "8px", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: message.type === 'success' ? "rgba(46, 125, 50, 0.1)" : "rgba(220, 38, 38, 0.1)", border: `1px solid ${message.type === 'success' ? "var(--success-color)" : "var(--danger-color)"}`, color: message.type === 'success' ? "var(--success-color)" : "var(--danger-color)" }}>
                                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                    {message.text}
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                                <button className="btn btn-primary" onClick={handleUpload} disabled={!file || isUploading}>
                                    {isUploading ? <><Loader2 className="animate-spin" size={18} style={{ marginRight: "8px" }} /> Завантаження...</> : <><UploadCloud size={18} style={{ marginRight: "8px" }} /> Імпортувати в БД</>}
                                </button>
                            </div>
                        </div>

                        {/* Історія імпортів */}
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Історія імпортованих баз</h3>
                            {loadingImports ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                                    <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
                                    Завантаження історії...
                                </div>
                            ) : importsList.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                                    Історія імпортів порожня. Завантажте свій перший Excel файл.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                    {importsList.map((imp: any) => {
                                        let count = 0;
                                        try {
                                            const parsed = JSON.parse(imp.parsedData);
                                            count = parsed.length;
                                        } catch (e) {}
                                        
                                        return (
                                            <div 
                                                key={imp.id} 
                                                className="hover-scale"
                                                style={{ 
                                                    background: 'var(--bg-secondary)', 
                                                    border: '1px solid var(--border-color)', 
                                                    borderRadius: '12px', 
                                                    padding: '1.5rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    minHeight: '180px',
                                                    position: 'relative',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => window.open(`/admin/imports/${imp.id}`, '_blank')}
                                            >
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                    <FileType size={36} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={imp.fileName}>{imp.fileName}</h4>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                                                            {new Date(imp.createdAt).toLocaleString('uk-UA')}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div style={{ marginTop: '1rem' }}>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                        Імпортовано записів: <strong style={{ color: 'var(--text-primary)' }}>{count}</strong>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 600 }}>Переглянути дані</span>
                                                    <button 
                                                        className="btn btn-danger"
                                                        style={{ 
                                                            padding: '0.4rem', 
                                                            background: 'rgba(239, 68, 68, 0.1)', 
                                                            color: 'var(--danger-color)', 
                                                            border: 'none', 
                                                            borderRadius: '6px',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteImport(imp.id);
                                                        }}
                                                        title="Видалити з історії"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
