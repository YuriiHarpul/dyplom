"use client";

import { useState } from "react";
import { UploadCloud, FileType, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function AdminPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
                setFile(null); // скидання форми
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

    return (
        <main className="container" style={{ paddingTop: "10vh", paddingBottom: "5vh" }}>
            <div className="glass-panel animate-fade-in" style={{ padding: "3rem", margin: "0 auto", maxWidth: "800px" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h2>Управління базою дипломів</h2>
                    <p style={{ color: "var(--text-secondary)" }}>Завантажте список проєктів у форматі XLSX або PDF</p>
                </div>

                {/* Drag & Drop Zone */}
                <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    style={{
                        border: `2px dashed ${file ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        borderRadius: "12px",
                        padding: "4rem 2rem",
                        textAlign: "center",
                        backgroundColor: file ? "rgba(59, 130, 246, 0.05)" : "rgba(15, 23, 42, 0.4)",
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
                        backgroundColor: message.type === 'success' ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
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
                            style={{ backgroundColor: "transparent", border: "1px solid var(--border-color)" }}
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
        </main>
    );
}
