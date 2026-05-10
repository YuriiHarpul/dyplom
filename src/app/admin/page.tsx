'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileType, CheckCircle, AlertTriangle, Loader2, Users, Search, Edit2 } from "lucide-react";

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

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
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
    }, []);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch('http://localhost:3001/api/users');
            const data = await res.json();
            setUsersList(data);
            setTeachersList(data.filter((u: any) => u.role === 'TEACHER'));
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingUsers(false);
        }
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



    const filteredUsers = usersList.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!user) return null;

    return (
        <main className="container" style={{ paddingTop: "5vh", paddingBottom: "5vh" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Кабінет Адміністратора</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{user?.name}</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Section 1: Users List */}
                <div className="glass-panel" style={{ padding: "2rem" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={20} /> Користувачі системи</h3>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input 
                                type="text" 
                                className="input-control" 
                                placeholder="Пошук за ім'ям або email..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: '2rem', padding: '0.5rem 1rem 0.5rem 2rem' }}
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
                                    <th>Керівник</th>
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
                                                    <select 
                                                        className="input-control" 
                                                        style={{ padding: '0.3rem', fontSize: '0.85rem', width: 'auto', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px' }} 
                                                        value={u.studentProject?.teacher?.id || ""} 
                                                        onChange={(e) => handleAssignTeacher(u.id, e.target.value)}
                                                    >
                                                        <option value="">Не обрано</option>
                                                        {teachersList.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section 2: Upload Files */}
                <div className="glass-panel" style={{ padding: "2rem" }}>
                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <h3>Управління базою дипломів</h3>
                        <p style={{ color: "var(--text-secondary)" }}>Завантажте список проєктів у форматі XLSX або PDF</p>
                    </div>

                    {/* Drag & Drop Zone */}
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
                        <input
                            type="file"
                            id="file-upload"
                            style={{ display: "none" }}
                            accept=".xlsx,.pdf"
                            onChange={handleFileChange}
                        />

                        {file ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                                <FileType size={48} color="var(--primary-color)" />
                                <div>
                                    <strong style={{ fontSize: "1.2rem", display: "block" }}>{file.name}</strong>
                                    <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                        {(file.size / 1024).toFixed(1)} KB
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "var(--text-secondary)" }}>
                                <UploadCloud size={48} />
                                <div>
                                    <strong style={{ fontSize: "1.1rem", display: "block", color: "var(--text-primary)" }}>Перетягніть файл сюди</strong>
                                    <span>або натисніть для вибору</span>
                                </div>
                                <p style={{ fontSize: "0.85rem", marginTop: "1rem" }}>Підтримуються: .xlsx (Excel) та .pdf</p>
                            </div>
                        )}
                    </div>

                    {/* Повідомлення */}
                    {message && (
                        <div style={{
                            padding: "1rem 1.5rem",
                            borderRadius: "8px",
                            marginBottom: "2rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            backgroundColor: message.type === 'success' ? "rgba(46, 125, 50, 0.1)" : "rgba(220, 38, 38, 0.1)",
                            border: `1px solid ${message.type === 'success' ? "var(--success-color)" : "var(--danger-color)"}`,
                            color: message.type === 'success' ? "var(--success-color)" : "var(--danger-color)"
                        }}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                            {message.text}
                        </div>
                    )}

                    {/* Кнопка завантаження */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                        {file && (
                            <button
                                className="btn"
                                style={{ backgroundColor: "transparent", border: "1px solid var(--border-color)", color: 'var(--text-primary)' }}
                                onClick={() => { setFile(null); setMessage(null); }}
                                disabled={isUploading}
                            >
                                Скасувати
                            </button>
                        )}
                        <button
                            className="btn btn-primary"
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            style={{ opacity: (!file || isUploading) ? 0.6 : 1 }}
                        >
                            {isUploading ? (
                                <><Loader2 className="animate-spin" size={18} style={{ marginRight: "8px" }} /> Обробка файлу...</>
                            ) : (
                                <><UploadCloud size={18} style={{ marginRight: "8px" }} /> Імпортувати в БД</>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </main>
    );
}
