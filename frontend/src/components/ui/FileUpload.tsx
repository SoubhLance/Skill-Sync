import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, X, CheckCircle2, FileUp, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  subLabel?: string;
  accept?: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  icon?: React.ReactNode;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  subLabel = "PDF, DOCX, or TXT up to 10MB",
  accept = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain",
  file,
  onFileSelect,
  icon,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMsg(null);
    const validExtensions = ['.pdf', '.docx', '.txt'];
    const hasValidExt = validExtensions.some(ext => 
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setErrorMsg("Please upload a PDF, DOCX, or TXT document.");
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrorMsg("File size exceeds 15MB limit.");
      return;
    }

    onFileSelect(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full space-y-2 font-mono">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
          {icon || <FileUp className="w-4 h-4 text-[var(--accent-color)]" />}
          {label}
        </label>
        {file && (
          <span className="text-[10px] text-[#1A7F37] dark:text-[#2DA44E] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready for matching
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept={accept}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative group cursor-pointer overflow-hidden rounded-md border-2 border-dashed p-6 text-center transition-all duration-200 ${
              isDragOver
                ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10 scale-[1.01] shadow-lg'
                : 'border-[var(--border-hairline)] hover:border-[var(--accent-color)]/60 bg-[var(--bg-paper)] hover:bg-[var(--bg-surface)]'
            }`}
          >
            {/* Aceternity Grid Accent Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#8881_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
              <motion.div
                animate={{ y: isDragOver ? -4 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex items-center justify-center shadow-xs text-[var(--accent-color)] group-hover:scale-110 transition-transform"
              >
                <UploadCloud className="w-6 h-6" />
              </motion.div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-[var(--text-main)] font-sans">
                  Drag & drop your document here, or <span className="text-[var(--accent-color)] underline decoration-dashed underline-offset-4">browse</span>
                </p>
                <p className="text-[10px] text-[var(--text-muted)] font-mono">
                  {subLabel}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-md border border-[#2DA44E]/40 bg-[#DAFBE1]/20 dark:bg-[#2DA44E]/10 flex items-center justify-between font-mono text-xs shadow-xs"
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-sm bg-[#DAFBE1] dark:bg-[#2DA44E]/20 text-[#1A7F37] dark:text-[#2DA44E] flex items-center justify-center shrink-0 border border-[#2DA44E]/30 font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="font-bold text-xs text-[var(--text-main)] truncate font-sans">
                  {file.name}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {formatFileSize(file.size)} • {file.name.split('.').pop()?.toUpperCase()} Document
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onFileSelect(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1.5 rounded-sm hover:bg-[#CF222E]/10 text-[var(--text-muted)] hover:text-[#CF222E] transition-colors cursor-pointer shrink-0 ml-2"
              title="Remove File"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {errorMsg && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-[#CF222E] flex items-center gap-1 font-mono pt-1"
        >
          <AlertCircle className="w-3 h-3 shrink-0" />
          {errorMsg}
        </motion.p>
      )}
    </div>
  );
};
