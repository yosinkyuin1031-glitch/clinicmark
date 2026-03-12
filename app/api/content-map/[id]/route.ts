import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/lib/auth';
import { prisma }           from '@/lib/db/prisma';
import { z }                from 'zod';

const updateSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  contentType: z.enum(['blog', 'video', 'gmb', 'instagram', 'faq']).optional(),
  symptom:     z.string().optional(),
  theme:       z.string().optional(),
  target:      z.string().optional(),
  urlOrMemo:   z.string().optional(),
  status:      z.enum(['planned', 'creating', 'published']).optional(),
  tags:        z.array(z.string()).optional(),
  note:        z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

// ─── PUT: 更新 ──────────────────────────────────────────
export async function PUT(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = await context.params;

    const body   = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '入力値が不正です', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const data: Record<string, unknown> = { ...input };
    if (input.tags !== undefined) {
      data.tags = JSON.stringify(input.tags);
    }

    const item = await prisma.contentMap.update({ where: { id }, data });

    return NextResponse.json({ item });
  } catch (e) {
    console.error('[content-map PUT]', e);
    return NextResponse.json({ error: '更新中にエラーが発生しました' }, { status: 500 });
  }
}

// ─── DELETE: 削除 ──────────────────────────────────────
export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = await context.params;

    await prisma.contentMap.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[content-map DELETE]', e);
    return NextResponse.json({ error: '削除中にエラーが発生しました' }, { status: 500 });
  }
}
