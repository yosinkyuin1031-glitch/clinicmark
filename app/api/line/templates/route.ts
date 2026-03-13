import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const clinicId = req.nextUrl.searchParams.get('clinicId');
  if (!clinicId) return NextResponse.json({ error: 'clinicIdが必要です' }, { status: 400 });

  const category = req.nextUrl.searchParams.get('category') ?? undefined;

  const items = await prisma.lineTemplate.findMany({
    where: { clinicId, ...(category ? { category } : {}) },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({
    data: items.map((t) => ({
      ...t,
      quickReplies: JSON.parse(t.quickReplies),
      tags:         JSON.parse(t.tags),
    })),
    total: items.length,
  });
}

export async function POST(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const body = await req.json();
  const { clinicId, title, category, message, quickReplies = [], isActive = true, tags = [] } = body;

  if (!clinicId || !title || !category || !message) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
  }

  const created = await prisma.lineTemplate.create({
    data: {
      clinicId, title, category, message, isActive,
      quickReplies: JSON.stringify(quickReplies),
      tags:         JSON.stringify(tags),
    },
  });

  return NextResponse.json({
    data: { ...created, quickReplies: JSON.parse(created.quickReplies), tags: JSON.parse(created.tags) },
  });
}
