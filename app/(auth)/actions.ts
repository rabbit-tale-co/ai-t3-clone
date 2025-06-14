'use server';

import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { createUser, getUser, updateUserById } from '@/lib/db/queries';
import { auth } from './auth';
import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: 'user_exists' } as RegisterActionState;
    }
    await createUser(validatedData.email, validatedData.password);
    // console.log('User created:', { email: validatedData.email });
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(50),
  email: z.string().email(),
});

export interface UpdateProfileActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'unauthorized'
    | 'invalid_data';
  error?: string;
}

export const updateProfile = async (
  _: UpdateProfileActionState,
  formData: FormData,
): Promise<UpdateProfileActionState> => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { status: 'unauthorized' };
    }

    const validatedData = updateProfileSchema.parse({
      fullName: formData.get('fullName'),
      email: formData.get('email'),
    });

    await updateUserById({
      id: session.user.id,
      fullName: validatedData.fullName,
      email: validatedData.email,
    });

    // Revalidate all pages that might show user data
    revalidatePath('/', 'layout'); // Revalidate the entire layout

    // Also revalidate user-specific cache tags
    revalidateTag(`user-${session.user.id}`);

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export async function revalidateUserData() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Revalidate all pages that might show user data
    revalidatePath('/', 'layout'); // Revalidate the entire layout

    // Also revalidate user-specific cache tags
    revalidateTag(`user-${session.user.id}`);

    return { success: true };
  } catch (error) {
    console.error('Revalidation error:', error);
    return { success: false, error: 'Failed to revalidate' };
  }
}
