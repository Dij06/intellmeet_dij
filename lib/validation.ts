import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Valid email is required').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128).optional(),
});

export const createMeetingSchema = z.object({
  title: z.string().trim().min(1, 'Meeting title is required').max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  workspaceId: z.string().trim().optional().nullable(),
  status: z.enum(['SCHEDULED', 'LIVE', 'ENDED']).optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(['SCHEDULED', 'LIVE', 'ENDED']).optional(),
  transcript: z.string().max(100000).optional().nullable(),
  sharedNotes: z.string().max(50000).optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const summarizeSchema = z.object({
  transcript: z.string().trim().min(1, 'Transcript is required').max(100000),
});

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Workspace name must be at least 2 characters').max(100),
  description: z.string().trim().max(500).optional().nullable(),
});

export const addMemberSchema = z.object({
  workspaceId: z.string().trim().min(1),
  email: z.string().trim().email().toLowerCase(),
  name: z.string().trim().min(1).max(80).optional(),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  meetingId: z.string().trim().optional().nullable(),
  workspaceId: z.string().trim().optional().nullable(),
  assigneeName: z.string().trim().max(80).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assigneeName: z.string().trim().max(80).optional().nullable(),
});

export const createMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(2000),
  senderName: z.string().trim().min(1).max(80).optional(),
});
