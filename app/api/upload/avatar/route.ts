import { put, del } from '@vercel/blob';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { updateUserById, getUserById } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 },
      );
    }

    // Get current user to check if they have an existing avatar
    const currentUser = await getUserById(session.user.id);

    // Delete old avatar if exists
    if (currentUser?.avatarUrl?.includes('blob.vercel-storage.com')) {
      try {
        await del(currentUser.avatarUrl);
      } catch (error) {
        console.error('Failed to delete old avatar:', error);
      }
    }

    // Upload new avatar
    const filename = `avatar-${session.user.id}-${Date.now()}.${file.name.split('.').pop() ?? 'jpg'}`;
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Update user avatar URL in database
    await updateUserById({
      id: session.user.id,
      avatarUrl: blob.url,
    });

    return NextResponse.json({
      success: true,
      avatarUrl: blob.url,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const currentUser = await getUserById(session.user.id);

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete avatar from blob storage if exists
    if (currentUser.avatarUrl?.includes('blob.vercel-storage.com')) {
      try {
        await del(currentUser.avatarUrl);
      } catch (error) {
        console.error('Failed to delete avatar from storage:', error);
      }
    }

    // Remove avatar URL from database (will use default)
    await updateUserById({
      id: session.user.id,
      avatarUrl: undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar removed successfully',
    });
  } catch (error) {
    console.error('Avatar removal error:', error);
    return NextResponse.json(
      { error: 'Failed to remove avatar' },
      { status: 500 },
    );
  }
}
