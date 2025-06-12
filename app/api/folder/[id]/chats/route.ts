import { NextResponse } from 'next/server';
import { getChatsByFolderId } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    const { id: folderId } = await context.params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 },
      );
    }

    // Pobierz czaty z folderu
    const { chats, hasMore } = await getChatsByFolderId({
      folderId,
      limit: 100, // Limit może być dostosowany
      startingAfter: null,
      endingBefore: null,
    });

    return NextResponse.json({ chats, hasMore });
  } catch (error) {
    console.error('Failed to fetch folder chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder chats' },
      { status: 500 },
    );
  }
}
