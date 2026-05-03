"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { DownloadCloud, FileStack, Loader2, Paperclip, UploadCloud } from "lucide-react";

interface UploadedDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string | null;
  storageProvider?: string;
  generatedAt: string;
}

interface DocumentUploadPanelProps {
  entityType: "QUOTE" | "ORDER" | "CONTRACT";
  entityId: string;
  referenceCode: string;
  documents: UploadedDocument[];
  userId?: string;
}

const documentTypes = [
  { value: "ATTACHMENT", label: "Tệp đính kèm" },
  { value: "SIGNED_DOCUMENT", label: "Bản đã ký" },
  { value: "CUSTOMER_FILE", label: "Hồ sơ khách hàng" },
  { value: "TECHNICAL_FILE", label: "Hồ sơ kỹ thuật" },
  { value: "OTHER", label: "Khác" },
];

const uploadFolders: Record<DocumentUploadPanelProps["entityType"], string> = {
  QUOTE: "quotes",
  ORDER: "orders",
  CONTRACT: "contracts",
};

export function DocumentUploadPanel({
  entityType,
  entityId,
  referenceCode,
  documents,
  userId,
}: DocumentUploadPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [documentType, setDocumentType] = useState("ATTACHMENT");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Vui lòng chọn file");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subFolder", uploadFolders[entityType]);
        formData.append("entityType", entityType);
        formData.append("entityId", entityId);
        formData.append("documentType", documentType);
        formData.append("referenceCode", referenceCode);
        if (note) formData.append("note", note);
        if (userId) formData.append("uploadedBy", userId);

        const response = await fetch("/api/upload", { method: "POST", body: formData });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || "Upload file thất bại");
        }

        setFile(null);
        setNote("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload file thất bại");
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <FileStack size={14} className="text-gray-500" /> Tài liệu upload
        </h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase">{referenceCode}</span>
      </div>

      <div className="space-y-2 mb-5">
        {documents.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Chưa có file upload thủ công.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm">
              <div className="min-w-0">
                <div className="font-semibold text-gray-800 truncate">{doc.fileName}</div>
                <div className="text-[10px] text-gray-400">
                  {doc.documentType} · {doc.storageProvider || "LOCAL"} · {new Date(doc.generatedAt).toLocaleDateString("vi-VN")}
                </div>
              </div>
              {doc.fileUrl && (
                <a href={doc.fileUrl} target="_blank" className="shrink-0 p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-white">
                  <DownloadCloud size={16} />
                </a>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-100 pt-4">
        {error && <div className="p-2 rounded-lg bg-red-50 text-red-600 text-xs">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-2">
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300"
          >
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 border border-dashed border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-pointer hover:bg-gray-50">
            <Paperclip size={14} />
            <span className="truncate">{file ? file.name : "Chọn file PDF/DOCX/XLSX/ảnh"}</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú tùy chọn"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300"
          />
          <button
            type="submit"
            disabled={isPending || !file}
            className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-900 disabled:opacity-50"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            Upload
          </button>
        </div>
      </form>
    </div>
  );
}
