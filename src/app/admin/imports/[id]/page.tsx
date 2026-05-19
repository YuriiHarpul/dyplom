'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileSpreadsheet, Loader2, X, Download, Plus, Pencil, Trash2, Check } from "lucide-react";

export default function ImportDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;
    
    const [importData, setImportData] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // States for Editing
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editVal, setEditVal] = useState<any>({ studentName: "", group: "", title: "", teacherName: "" });

    // Fetch Details
    useEffect(() => {
        if (!id) return;
        
        const fetchDetails = async () => {
            try {
                const res = await fetch(`http://localhost:3001/api/admin/imports/${id}`);
                if (!res.ok) {
                    throw new Error("Не вдалося завантажити деталі імпорту");
                }
                const data = await res.json();
                setImportData(data);
                if (data.parsedData) {
                    try {
                        setItems(JSON.parse(data.parsedData));
                    } catch (e) {
                        setItems([]);
                    }
                }
            } catch (err: any) {
                setError(err.message || "Помилка при завантаженні");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    const handleAddRow = () => {
        // Prevent adding multiple empty rows at once
        if (editingIdx !== null) {
            alert("Будь ласка, спочатку збережіть або скасуйте попереднє редагування!");
            return;
        }
        const newRow = {
            studentName: "",
            group: "",
            title: "",
            teacherName: ""
        };
        const newItems = [...items, newRow];
        setItems(newItems);
        setEditingIdx(newItems.length - 1);
        setEditVal({
            studentName: "",
            group: "",
            title: "",
            teacherName: ""
        });
        
        // Scroll to bottom
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

    const startEdit = (idx: number) => {
        if (editingIdx !== null) {
            alert("Будь ласка, спочатку збережіть або скасуйте попереднє редагування!");
            return;
        }
        setEditingIdx(idx);
        setEditVal({ ...items[idx] });
    };

    const cancelEdit = (idx: number) => {
        // If this was a newly added row with no content, remove it
        if (!items[idx].studentName && !items[idx].title && !items[idx].teacherName) {
            setItems(items.filter((_, i) => i !== idx));
        }
        setEditingIdx(null);
    };

    const saveRow = async (idx: number) => {
        if (!editVal.studentName.trim() || !editVal.title.trim() || !editVal.teacherName.trim()) {
            alert("Поля: Студент, Тема та Керівник обов'язкові для заповнення!");
            return;
        }

        const updatedItems = [...items];
        updatedItems[idx] = { ...editVal };

        try {
            const res = await fetch(`http://localhost:3001/api/admin/imports/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items: updatedItems })
            });

            if (res.ok) {
                setItems(updatedItems);
                setEditingIdx(null);
            } else {
                alert("Не вдалося зберегти зміни на сервері.");
            }
        } catch (e) {
            console.error(e);
            alert("Помилка при збереженні.");
        }
    };

    const deleteRow = async (idx: number) => {
        if (!confirm("Ви впевнені, що хочете видалити цей запис?")) return;

        const updatedItems = items.filter((_, i) => i !== idx);

        try {
            const res = await fetch(`http://localhost:3001/api/admin/imports/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items: updatedItems })
            });

            if (res.ok) {
                setItems(updatedItems);
                if (editingIdx === idx) {
                    setEditingIdx(null);
                } else if (editingIdx !== null && editingIdx > idx) {
                    setEditingIdx(editingIdx - 1);
                }
            } else {
                alert("Не вдалося видалити запис на сервері.");
            }
        } catch (e) {
            console.error(e);
            alert("Помилка при видаленні.");
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Завантаження даних імпорту...</p>
            </div>
        );
    }

    if (error || !importData) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem' }}>
                <p style={{ color: 'var(--danger-color)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>{error || "Імпорт не знайдено"}</p>
                <button className="btn btn-primary" onClick={() => window.close()}>Закрити вкладку</button>
            </div>
        );
    }

    return (
        <main style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '3rem 2rem' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(46, 125, 50, 0.1)', borderRadius: '12px', color: 'var(--primary-color)' }}>
                            <FileSpreadsheet size={32} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>{importData.fileName}</h1>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Імпортовано: {new Date(importData.createdAt).toLocaleString('uk-UA')} • Записів: {items.length}
                            </span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            className="btn btn-primary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--success-color)' }}
                            onClick={handleAddRow}
                        >
                            <Plus size={18} /> Додати запис
                        </button>
                        {importData.fileUrl && (
                            <a 
                                href={`http://localhost:3001${importData.fileUrl}`} 
                                download
                                className="btn" 
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textDecoration: 'none', color: 'var(--text-primary)' }}
                            >
                                <Download size={18} /> Завантажити Excel
                            </a>
                        )}
                        <button 
                            className="btn btn-primary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
                            onClick={() => window.close()}
                        >
                            Закрити вкладку
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
                    {items.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Дані відсутні або файл порожній. Натисніть "Додати запис", щоб внести дані вручну.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    <th style={{ padding: '1rem', width: '50px' }}>#</th>
                                    <th style={{ padding: '1rem', width: '220px' }}>Студент</th>
                                    <th style={{ padding: '1rem', width: '120px' }}>Група / Курс</th>
                                    <th style={{ padding: '1rem' }}>Тема роботи</th>
                                    <th style={{ padding: '1rem', width: '220px' }}>Науковий керівник</th>
                                    <th style={{ padding: '1rem', width: '130px', textAlign: 'center' }}>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item: any, idx: number) => {
                                    const isEditing = editingIdx === idx;
                                    
                                    return (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s', background: isEditing ? 'rgba(46, 125, 50, 0.03)' : 'transparent' }}>
                                            <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{idx + 1}</td>
                                            
                                            {/* Student Column */}
                                            <td style={{ padding: '1rem' }}>
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        className="input-control" 
                                                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                                                        value={editVal.studentName} 
                                                        placeholder="ПІБ Студента"
                                                        onChange={(e) => setEditVal({ ...editVal, studentName: e.target.value })} 
                                                    />
                                                ) : (
                                                    <strong style={{ color: 'var(--text-primary)' }}>{item.studentName}</strong>
                                                )}
                                            </td>

                                            {/* Group Column */}
                                            <td style={{ padding: '1rem' }}>
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        className="input-control" 
                                                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                                                        value={editVal.group} 
                                                        placeholder="Група"
                                                        onChange={(e) => setEditVal({ ...editVal, group: e.target.value })} 
                                                    />
                                                ) : (
                                                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'rgba(0,0,0,0.05)', fontSize: '0.85rem', fontWeight: 500 }}>
                                                        {item.group || '-'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Title Column */}
                                            <td style={{ padding: '1rem' }}>
                                                {isEditing ? (
                                                    <textarea 
                                                        className="input-control" 
                                                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', width: '100%', minHeight: '60px', resize: 'vertical' }}
                                                        value={editVal.title} 
                                                        placeholder="Тема дипломного проєкту"
                                                        onChange={(e) => setEditVal({ ...editVal, title: e.target.value })} 
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: '0.95rem', maxWidth: '400px', display: 'block', lineHeight: '1.4' }}>{item.title}</span>
                                                )}
                                            </td>

                                            {/* Teacher Column */}
                                            <td style={{ padding: '1rem' }}>
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        className="input-control" 
                                                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                                                        value={editVal.teacherName} 
                                                        placeholder="ПІБ Керівника"
                                                        onChange={(e) => setEditVal({ ...editVal, teacherName: e.target.value })} 
                                                    />
                                                ) : (
                                                    <span style={{ fontWeight: 500 }}>{item.teacherName}</span>
                                                )}
                                            </td>

                                            {/* Actions Column */}
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button 
                                                            className="btn btn-primary" 
                                                            style={{ padding: '0.4rem', background: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                                                            onClick={() => saveRow(idx)}
                                                            title="Зберегти"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button 
                                                            className="btn" 
                                                            style={{ padding: '0.4rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                                                            onClick={() => cancelEdit(idx)}
                                                            title="Скасувати"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button 
                                                            className="btn" 
                                                            style={{ padding: '0.4rem', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }} 
                                                            onClick={() => startEdit(idx)}
                                                            title="Редагувати"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button 
                                                            className="btn btn-danger" 
                                                            style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-color)' }} 
                                                            onClick={() => deleteRow(idx)}
                                                            title="Видалити"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </main>
    );
}
