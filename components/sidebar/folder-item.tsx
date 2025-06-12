import useSWRInfinite from 'swr/infinite';
import { ChatItem } from './chat-item';
import { Button } from '../ui/button';
import { getChatHistoryPaginationKey } from '@/lib/constants';

export function FolderItem({ expanded }: { expanded: boolean }) {
  const { data, size, setSize, isLoading } = useSWRInfinite(
    getChatHistoryPaginationKey,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch folder chats');
      return res.json();
    },
    { revalidateOnFocus: false },
  );

  const chats = data ? data.flatMap((page) => page.chats) : [];
  const hasMore = data?.[data.length - 1]?.hasMore;

  return (
    <div>
      {expanded && (
        <div>
          {chats.length > 0 && (
            <div>
              {chats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={false}
                  onDelete={() => { }}
                  setOpenMobile={() => { }}
                />
              ))}
              {hasMore && (
                <Button onClick={() => setSize(size + 1)}>Load more</Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
