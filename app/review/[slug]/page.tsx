/**
 * 口コミ収集ページ（公開・認証不要）
 * /review/[slug] でアクセス可能
 */
import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import ReviewPageClient from './ReviewPageClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ReviewPage({ params }: Props) {
  const { slug } = await params;

  const clinic = await prisma.clinic.findUnique({ where: { slug } });
  if (!clinic) notFound();

  const configRecord = await prisma.generatedContent.findFirst({
    where:   { clinicId: clinic.id, type: 'REVIEW_PAGE_CONFIG' },
    orderBy: { createdAt: 'desc' },
  });

  if (!configRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">口コミ収集ページは準備中です</p>
      </div>
    );
  }

  const config = JSON.parse(configRecord.output);

  return <ReviewPageClient config={config} />;
}
