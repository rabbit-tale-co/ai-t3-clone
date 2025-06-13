'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  History,
  Download,
  Upload,
  Trash2,
  CheckSquare,
  Square,
  RotateCcw,
  AlertTriangle,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/hooks/use-language';

interface ChatHistoryItem {
  id: string;
  title: string;
  date: string;
  messageCount: number;
}

export function HistoryTab() {
  const { t } = useLanguage();
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isImportDisabled] = useState(true); // Temporarily disabled as shown in screenshot
  const [checkboxesDisabled, setCheckboxesDisabled] = useState(false); // Control checkbox state

  // Mock chat history data
  const chatHistory: ChatHistoryItem[] = [
    {
      id: '1',
      title: 'Entitlements by User Type: Convert TODOs to code',
      date: '6/13/2025, 9:34:35 AM',
      messageCount: 12,
    },
    {
      id: '2',
      title: 'Greeting',
      date: '6/11/2025, 8:46:27 AM',
      messageCount: 3,
    },
    {
      id: '3',
      title: 'Write Very Long Text',
      date: '6/10/2025, 9:14:51 PM',
      messageCount: 8,
    },
  ];

  const handleSelectAll = () => {
    if (selectedChats.length === chatHistory.length) {
      setSelectedChats([]);
    } else {
      setSelectedChats(chatHistory.map((chat) => chat.id));
    }
  };

  const handleChatToggle = (chatId: string) => {
    setSelectedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId],
    );
  };

  const handleExport = () => {
    // Mock export functionality
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      chats: chatHistory.filter((chat) => selectedChats.includes(chat.id)),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    // Mock import functionality - would open file picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            console.log('Imported data:', data);
            // Would handle the imported data here
          } catch (error) {
            console.error('Failed to parse JSON:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleDelete = () => {
    // Mock delete functionality
    console.log('Deleting chats:', selectedChats);
    setSelectedChats([]);
    setShowDeleteDialog(false);
  };

  const handleRestoreOldChats = () => {
    // Mock restore functionality
    console.log('Restoring old chats');
    setShowRestoreDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-xl font-semibold text-pink-900 dark:text-pink-100 mb-2">
          Message History
        </h2>
        <p className="text-pink-600 dark:text-pink-400">
          Save your history as JSON, or import someone else&apos;s. Importing
          will NOT delete existing messages
        </p>
      </div>

      {/* Temporarily Disabled Notice */}
      {isImportDisabled && (
        <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
          <AlertTriangle
            size={16}
            className="text-yellow-600 dark:text-yellow-400"
          />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <div className="font-semibold">Temporarily Disabled - Sorry</div>
            <div className="text-sm mt-1">
              This feature is currently unavailable while we perform
              maintenance.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled
          className={`border-pink-200 dark:border-pink-800/50 ${
            !checkboxesDisabled
              ? 'text-pink-400 dark:text-pink-500 opacity-50 cursor-not-allowed'
              : 'text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20'
          }`}
        >
          {selectedChats.length === chatHistory.length ? (
            <>
              <Square size={16} />
              Deselect All
            </>
          ) : (
            <>
              <CheckSquare size={16} />
              Select All
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled
          className={`border-pink-200 dark:border-pink-800/50 ${
            checkboxesDisabled || selectedChats.length === 0
              ? 'text-pink-400 dark:text-pink-500 opacity-50 cursor-not-allowed'
              : 'text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20'
          }`}
        >
          <Download size={16} />
          Export
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          disabled
          className={`border-red-200 dark:border-red-800/50 ${
            checkboxesDisabled || selectedChats.length === 0
              ? 'text-red-400 dark:text-red-500 opacity-50 cursor-not-allowed'
              : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}
        >
          <Trash2 size={16} />
          Delete
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleImport}
          disabled
          className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 disabled:opacity-50"
        >
          <Upload size={16} />
          Import
        </Button>
      </div>

      {/* Chat History Table */}
      <div className="border border-pink-200/50 dark:border-pink-800/30 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-pink-50/50 dark:bg-pink-950/20">
            <TableRow className="border-pink-200/50 dark:border-pink-800/30">
              <TableHead className="w-9 pl-4">
                <Checkbox
                  checked={
                    selectedChats.length === chatHistory.length &&
                    chatHistory.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                  disabled
                  className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600 border-pink-300 dark:border-pink-700"
                />
              </TableHead>
              <TableHead className="text-pink-900 dark:text-pink-100 font-medium">
                <div className="flex items-center">
                  <MessageSquare
                    size={16}
                    className="mr-2 text-pink-500 dark:text-pink-400"
                  />
                  Chat Title
                </div>
              </TableHead>
              <TableHead className="text-pink-900 dark:text-pink-100 font-medium">
                <div className="flex items-center">
                  <Calendar
                    size={16}
                    className="mr-2 text-pink-500 dark:text-pink-400"
                  />
                  Date
                </div>
              </TableHead>
              <TableHead className="text-pink-900 dark:text-pink-100 font-medium text-right pr-4">
                Messages
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chatHistory.map((chat) => (
              <TableRow
                key={chat.id}
                className="border-pink-200/50 dark:border-pink-800/30 hover:bg-pink-50/50 dark:hover:bg-pink-900/10"
              >
                <TableCell className="w-9 pl-4">
                  <Checkbox
                    checked={selectedChats.includes(chat.id)}
                    onCheckedChange={() => handleChatToggle(chat.id)}
                    disabled
                    className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600 border-pink-300 dark:border-pink-700"
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium text-pink-900 dark:text-pink-100 truncate max-w-xs">
                    {chat.title}
                  </div>
                </TableCell>
                <TableCell className="text-pink-600 dark:text-pink-400 text-sm">
                  {chat.date}
                </TableCell>
                <TableCell className="text-pink-600 dark:text-pink-400 text-sm text-right pr-4">
                  {chat.messageCount} messages
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Sync Settings */}
      <div className="space-y-4 pt-4 border-t border-pink-200/50 dark:border-pink-800/30">
        <div className="flex items-center justify-between py-4 border-b border-pink-200/50 dark:border-pink-800/30">
          <div>
            <h4 className="text-sm font-medium text-pink-900 dark:text-pink-100">
              {t('settings.history.autoSave')}
            </h4>
            <p className="text-sm text-pink-600 dark:text-pink-400">
              {t('settings.history.autoSaveDescription')}
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between py-4 border-b border-pink-200/50 dark:border-pink-800/30">
          <div>
            <h4 className="text-sm font-medium text-pink-900 dark:text-pink-100">
              {t('settings.history.syncDevices')}
            </h4>
            <p className="text-sm text-pink-600 dark:text-pink-400">
              {t('settings.history.syncDescription')}
            </p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pt-6 border-t border-pink-200/50 dark:border-pink-800/30">
        <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-100 mb-4">
          Danger Zone
        </h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-pink-600 dark:text-pink-400 mb-3">
              If your chats from before June 1st are missing, click this to
              bring them back. Contact support if you have issues.
            </p>
            <Button
              variant="warningOutline"
              onClick={() => setShowRestoreDialog(true)}
            >
              <RotateCcw size={16} />
              Restore old chats
            </Button>
          </div>

          <div>
            <p className="text-sm text-pink-600 dark:text-pink-400 mb-3">
              Permanently delete your history from both your local device and
              our servers. *
            </p>
            <Button variant="destructive">
              <Trash2 size={16} />
              Delete Chat History
            </Button>
            <p className="text-xs text-pink-500 dark:text-pink-400 mt-2">
              * The retention policies of our LLM hosting partners may vary.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Chats</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedChats.length} selected
              chat{selectedChats.length !== 1 ? 's' : ''}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Old Chats</AlertDialogTitle>
            <AlertDialogDescription>
              This will attempt to restore chats from before June 1st. This
              process may take a few minutes. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreOldChats}>
              Restore Chats
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
