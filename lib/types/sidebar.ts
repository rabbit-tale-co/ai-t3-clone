import type { Chat, Folder, Tag } from '@/lib/db/schema';

export interface SidebarThread extends Omit<Chat, 'folderId'> {
  folder: {
    name: string;
    color: string;
  } | null;
  tags: Array<{
    id: string;
    label: string;
    color: string;
    userId: string;
  }>;
}

export interface SidebarData {
  threads: SidebarThread[];
  folders: Folder[];
  tags: Tag[];
  hasMore: boolean;
}

export interface CachedSidebarData extends SidebarData {
  timestamp: number;
}
