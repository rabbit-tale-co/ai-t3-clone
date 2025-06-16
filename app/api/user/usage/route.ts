import { auth } from '@/app/(auth)/auth';
import { getUserMessageCount } from '@/app/(chat)/actions';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getUserMessageCount(session.user.id, session.user.type);

    return Response.json(result);
  } catch (error) {
    console.error('Error in /api/user/usage:', error);
    return Response.json(
      { error: 'Failed to fetch usage data', success: false },
      { status: 500 }
    );
  }
}
