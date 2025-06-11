import { NextResponse } from 'next/server';
import { getMessageCountByUserId } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const count = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching message count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message count' },
      { status: 500 },
    );
  }
}
