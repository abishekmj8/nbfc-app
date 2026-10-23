"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, File, X, Check } from "lucide-react";

interface FileUploadProps {
  entityType: string;
  entityId: string;
  documentType: string;
  loanApplicationId?: string;
  onUploadComplete?: (doc: { id: string; fileName: string }) => void;
  accept?: string;
  label?: string;
}

export function FileUpload({
  entityType,
  entityId,
  documentType,
  loanApplicationId,
  onUploadComplete,
  accept = ".pdf,.jpg,.jpeg,.png,.webp",
  label = "Upload Document",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; fileName?: string; error?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", entityType);
    formData.append("entityId", entityId);
    formData.append("documentType", documentType);
    if (loanApplicationId) formData.append("loanApplicationId", loanApplicationId);

    try {
      const res = await fetch("/api/v1/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        setResult({ success: true, fileName: data.document.fileName });
        onUploadComplete?.(data.document);
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch {
      setResult({ success: false, error: "Upload failed. Please try again." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleUpload}
        className="hidden"
        id={`upload-${documentType}`}
      />
      <label htmlFor={`upload-${documentType}`}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer"
        >
          {uploading ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Uploading...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Upload size={14} />
              {label}
            </span>
          )}
        </Button>
      </label>

      {result && (
        <div className={`flex items-center gap-2 text-xs ${result.success ? "text-green-600" : "text-red-600"}`}>
          {result.success ? (
            <>
              <Check size={12} />
              <span>Uploaded: {result.fileName}</span>
            </>
          ) : (
            <>
              <X size={12} />
              <span>{result.error}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface DocumentListProps {
  documents: Array<{
    id: string;
    documentType: string;
    fileName: string;
    status: string;
    createdAt: string;
  }>;
}

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return <p className="text-sm text-gray-500">No documents uploaded</p>;
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between p-3 rounded border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <File size={16} className="text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {doc.documentType.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-gray-500">{doc.fileName}</p>
            </div>
          </div>
          <Badge
            variant={
              doc.status === "VERIFIED" ? "success"
              : doc.status === "REJECTED" ? "destructive"
              : "outline"
            }
          >
            {doc.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
