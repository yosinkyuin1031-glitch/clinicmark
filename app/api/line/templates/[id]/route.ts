import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const { id }  = await params;
  const body    = await req.json();
  const { quickReplies, tags, ...rest } = body;

  const updated = await prisma.lineTemplate.update({
    where: { id },
    data: {
      ...rest,
      ...(quickReplies !== undefined ? { quickReplies: JSON.stringify(quickReplies) } : {}),
      ...(tags         !== undefined ? { tags:         JSON.stringify(tags)         } : {}),
    },
  });

  return NextResponse.json({
    data: { ...updated, quickReplies: JSON.parse(updated.quickReplies), tags: JSON.parse(updated.tags) },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const { id } = await params;
  await prisma.lineTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
