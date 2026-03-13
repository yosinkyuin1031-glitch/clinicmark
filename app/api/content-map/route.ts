import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/lib/auth';
import { prisma }           from '@/lib/db/prisma';
import { z }                from 'zod';

const createSchema = z.object({
  clinicId:    z.string().min(1),
  title:       z.string().min(1).max(200),
  contentType: z.enum(['blog', 'video', 'gmb', 'instagram', 'faq']),
  symptom:     z.string().default(''),
  theme:       z.string().default(''),
  target:      z.string().default(''),
  urlOrMemo:   z.string().default(''),
  status:      z.enum(['planned', 'creating', 'published']).default('planned'),
  tags:        z.array(z.string()).default([]),
  note:        z.string().default(''),
});

// ─── GET: 一覧取得 ──────────────────────────────────────
export async function GET(req: Request) {
  try {
    // const session = await getServerSession(authOptions); // 認証一時無効
    // if (!session) { // 認証一時無効
      // return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効
    // } // 認証一時無効

    const { searchParams } = new URL(req.url);
    const clinicId    = searchParams.get('clinicId');
    const contentType = searchParams.get('contentType');
    const status      = searchParams.get('status');
    const symptom     = searchParams.get('symptom');

    if (!clinicId) {
      return NextResponse.json({ error: 'clinicId は必須です' }, { status: 400 });
    }

    const where: Record<string, unknown> = { clinicId };
    if (contentType) where.contentType = contentType;
    if (status)      where.status      = status;
    if (symptom)     where.symptom     = { contains: symptom };

    const items = await prisma.contentMap.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ items });
  } catch (e) {
    console.error('[content-map GET]', e);
    return NextResponse.json({ error: '取得中にエラーが発生しました' }, { status: 500 });
  }
}

// ─── POST: 新規作成 ─────────────────────────────────────
export async function POST(req: Request) {
  try {
    // const session = await getServerSession(authOptions); // 認証一時無効
    // if (!session) { // 認証一時無効
      // return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効
    // } // 認証一時無効

    const body   = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '入力値が不正です', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const clinic = await prisma.clinic.findUnique({ where: { id: input.clinicId } });
    if (!clinic) {
      return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });
    }

    const item = await prisma.contentMap.create({
      data: {
        clinicId:    input.clinicId,
        title:       input.title,
        contentType: input.contentType,
        symptom:     input.symptom,
        theme:       input.theme,
        target:      input.target,
        urlOrMemo:   input.urlOrMemo,
        status:      input.status,
        tags:        JSON.stringify(input.tags),
        note:        input.note,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error('[content-map POST]', e);
    return NextResponse.json({ error: '作成中にエラーが発生しました' }, { status: 500 });
  }
}
