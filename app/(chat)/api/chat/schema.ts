import { z } from 'zod/v4';
import { chatModels } from '@/lib/ai/models';

const textPartSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(['text']),
});

const allowedChatModels = chatModels.map((model) => model.id) as [
  string,
  ...string[],
];

export const postRequestBodySchema = z.object({
  id: z.uuid(),
  message: z.object({
    id: z.uuid(),
    createdAt: z.coerce.date(),
    role: z.enum(['user']),
    content: z.string().min(1).max(2000),
    parts: z.array(textPartSchema),
    experimental_attachments: z
      .array(
        z.object({
          url: z.url(),
          name: z.string().min(1).max(2000),
          contentType: z.file(),
        }),
      )
      .optional(),
  }),
  selectedChatModel: z.enum(allowedChatModels),
  selectedVisibilityType: z.enum(['public', 'private']),
  folderId: z.string().uuid().optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
