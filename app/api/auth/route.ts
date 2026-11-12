import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { isDbConnectionError } from '@/lib/demo-store';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(`auth:${ip}`, 15, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { email, name, password } = parsed.data;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'MEMBER',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      return NextResponse.json(
        { message: 'Account created successfully', user },
        { status: 201 }
      );
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        return NextResponse.json(
          {
            message: 'Demo mode active — account registered for session',
            user: { id: `demo-${Date.now()}`, email, name, role: 'MEMBER' },
          },
          { status: 201 }
        );
      }
      throw dbErr;
    }
  } catch (error) {
    console.error('Auth registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
