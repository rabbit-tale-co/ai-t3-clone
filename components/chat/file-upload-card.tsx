'use client';

import type React from 'react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, ImagePlus, FileText, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadCardProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  maxFiles?: number;
}

export function FileUploadCard({
  isOpen,
  onClose,
  onUpload,
  maxFiles = 10,
}: FileUploadCardProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      const totalFiles = [...selectedFiles, ...newFiles];

      if (totalFiles.length > maxFiles) {
        alert(`You can upload a maximum of ${maxFiles} files.`);
        return;
      }

      setSelectedFiles(totalFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = [...selectedFiles, ...newFiles];

      if (totalFiles.length > maxFiles) {
        alert(`You can upload a maximum of ${maxFiles} files.`);
        return;
      }

      setSelectedFiles(totalFiles);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onUpload(selectedFiles);
    setSelectedFiles([]);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const size = bytes / Math.pow(k, i);
    const formattedSize = i === 0 ? size.toString() : size.toFixed(1);

    return `${formattedSize} ${sizes[i]}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-pink-50/95 to-pink-100/80 dark:from-black/98 dark:to-pink-950/30 border-pink-200/60 dark:border-pink-900/40 backdrop-blur-xl shadow-xl rounded-2xl">
        <DialogHeader className="border-b border-pink-200/50 dark:border-pink-800/30 pb-4">
          <DialogTitle className="flex items-center gap-2 text-pink-900 dark:text-pink-100">
            <Paperclip className="size-5 text-pink-600 dark:text-pink-400" />
            Upload Files
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Drag & Drop Area */}
          <Card
            className={cn(
              'border-2 border-dashed transition-all duration-200 cursor-pointer hover:border-pink-400 dark:hover:border-pink-600 bg-pink-50/30 dark:bg-pink-950/20 rounded-xl',
              dragActive
                ? 'border-pink-500 dark:border-pink-500 bg-pink-100/50 dark:bg-pink-900/30'
                : 'border-pink-300 dark:border-pink-800/50',
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="size-12 rounded-full border border-pink-300 dark:border-pink-700 flex items-center justify-center mb-3 bg-pink-100/50 dark:bg-pink-900/30">
                <Upload className="size-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="font-medium mb-1 text-pink-900 dark:text-pink-100">
                {dragActive ? 'Drop files here' : 'Drag and drop files here'}
              </h3>
              <p className="text-xs text-pink-700 dark:text-pink-300 mb-3">
                Images, PDF and documents (max. {maxFiles} files)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/50 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <ImagePlus className="size-3 mr-1.5" />
                Browse Files
              </Button>
            </CardContent>
          </Card>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-pink-900 dark:text-pink-100">
                    Selected Files
                  </h3>
                  <Badge
                    variant="secondary"
                    className="h-5 px-2 text-xs bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/50"
                  >
                    {selectedFiles.length}/{maxFiles}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                  className="h-7 px-2 text-xs text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-lg"
                >
                  Remove all
                </Button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-3 p-2 rounded-lg border border-pink-200/50 dark:border-pink-800/30 group bg-pink-50/30 dark:bg-pink-950/20"
                  >
                    <div className="size-8 rounded border border-pink-300 dark:border-pink-700 flex items-center justify-center bg-pink-100/50 dark:bg-pink-900/30">
                      {file.type?.startsWith('image/') ? (
                        <ImagePlus className="size-4 text-pink-600 dark:text-pink-400" />
                      ) : (
                        <FileText className="size-4 text-pink-600 dark:text-pink-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-pink-900 dark:text-pink-100 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-pink-700 dark:text-pink-300">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="size-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/50 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0}
              className="flex-1 bg-gradient-to-r from-pink-500 to-pink-400 hover:from-pink-400 hover:to-pink-300 text-white rounded-lg shadow-sm"
            >
              Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
