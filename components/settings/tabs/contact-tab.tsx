'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useLanguage } from '@/hooks/use-language';

export function ContactTab() {
  const { t } = useLanguage();

  const contactSchema = z.object({
    subject: z
      .string()
      .min(
        5,
        t('validation.errors.subjectMinLength') ||
          'Subject must be at least 5 characters',
      )
      .max(100, t('validation.errors.subjectTooLong') || 'Subject too long'),
    message: z
      .string()
      .min(
        10,
        t('validation.errors.messageMinLength') ||
          'Message must be at least 10 characters',
      )
      .max(1000, t('validation.errors.messageTooLong') || 'Message too long'),
  });

  const contactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  const onContactSubmit = (data: z.infer<typeof contactSchema>) => {
    toast.success(t('toast.settings.contact.messageSent'));
    contactForm.reset();
    console.log('Contact form:', data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-pink-900 dark:text-pink-100 mb-2">
          {t('settings.contact.title')}
        </h2>
        <p className="text-pink-600 dark:text-pink-400">
          {t('settings.contact.description')}
        </p>
      </div>

      <Form {...contactForm}>
        <form
          onSubmit={contactForm.handleSubmit(onContactSubmit)}
          className="space-y-4"
        >
          <FormField
            control={contactForm.control}
            name="subject"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-pink-800 dark:text-pink-200">
                  {t('settings.contact.subject')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('settings.contact.subjectPlaceholder')}
                    className="border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50 text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus:border-pink-400 dark:focus:border-pink-600"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={contactForm.control}
            name="message"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-pink-800 dark:text-pink-200">
                  {t('settings.contact.message')}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t('settings.contact.messagePlaceholder')}
                    rows={6}
                    className="border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50 text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus:border-pink-400 dark:focus:border-pink-600"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            {t('ui.buttons.send')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
