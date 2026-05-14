import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/app/lib/db/prisma';
import { hashPassword, validatePassword } from '@/app/lib/auth/password';

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Database is required for customer accounts' }, { status: 503 });
  }

  let body: { email?: string; password?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ success: false, error: 'Valid email is required' }, { status: 400 });
  }
  if (!body.password) {
    return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
  }
  const passwordError = validatePassword(body.password);
  if (passwordError) {
    return NextResponse.json({ success: false, error: passwordError }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    return NextResponse.json({ success: false, error: 'An account already exists for this email' }, { status: 409 });
  }

  const passwordHash = await hashPassword(body.password);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name: body.name?.trim() || existing?.name || email.split('@')[0],
      isGuest: false,
    },
    create: {
      email,
      passwordHash,
      name: body.name?.trim() || email.split('@')[0],
      role: 'user',
    },
  });

  await prisma.userWallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}
