'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderIcon } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        onClose();
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGuest = async () => {
    setIsLoading(true);
    try {
      await signIn('guest', { redirect: false });
      onClose();
    } catch (error) {
      setError('Failed to create guest account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-pink-50 to-pink-100/80 dark:from-pink-950/90 dark:to-pink-900/60 border border-pink-200 dark:border-pink-800/50 backdrop-blur-md shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-pink-900 dark:text-pink-100">
            Sign In
          </DialogTitle>
          <DialogDescription className="text-pink-700 dark:text-pink-300">
            Enter your credentials to access your account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-pink-800 dark:text-pink-200">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="bg-white/70 dark:bg-black/40 border-pink-300 dark:border-pink-800/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-pink-800 dark:text-pink-200"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="bg-white/70 dark:bg-black/40 border-pink-300 dark:border-pink-800/50"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCreateGuest}
              disabled={isLoading}
              className="border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/50"
            >
              Continue as Guest
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
            >
              {isLoading ? (
                <>
                  <LoaderIcon size={16} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
