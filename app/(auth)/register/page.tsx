'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { register, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';
import { signIn, } from 'next-auth/react';

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [plainPwd, setPlainPwd] = useState(''); // ← 2  przechowaj hasło
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    { status: 'idle' },
  );

  useEffect(() => {
    switch (state.status) {
      case 'user_exists':
        toast({ type: 'error', description: 'Account already exists!' });
        break;
      case 'failed':
        toast({ type: 'error', description: 'Failed to create account!' });
        break;
      case 'invalid_data':
        toast({ type: 'error', description: 'Invalid data!' });
        break;
      case 'success':
        toast({
          type: 'success',
          description: 'Account created successfully!',
        });
        setIsSuccessful(true);

        // 3️⃣  logujemy i przekierowujemy
        signIn('credentials', {
          email,
          password: plainPwd,
          callbackUrl: '/', // gdzie trafi po zalogowaniu
        });
        break;
    }
  }, [state.status, email, plainPwd]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    setPlainPwd(formData.get('password') as string); // ← 2
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {'Already have an account? '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
            {' instead.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
