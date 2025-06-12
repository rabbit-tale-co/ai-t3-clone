import { NextResponse } from 'next/server';
import { getChatsByFolderId } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const folderId = params.id;

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
