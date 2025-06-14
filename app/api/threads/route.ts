import { getSidebarThreadsByUserId } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

export async function GET(request: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number.parseInt(searchParams.get('limit') ?? '50');
  const startingAfter = searchParams.get('startingAfter') || null;
  const endingBefore = searchParams.get('endingBefore') || null;

  try {
    const data = await getSidebarThreadsByUserId({
      userId: session.user.id as string,
      limit,
      startingAfter,
      endingBefore,
    });

    return Response.json(data);
  } catch (error) {
    console.error('Failed to get sidebar threads:', error);
    return Response.json(
      { error: 'Failed to get sidebar threads' },
      { status: 500 },
    );
  }
}
