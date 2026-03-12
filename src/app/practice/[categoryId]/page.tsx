import { createServerSupabase } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { PracticeCategoryClient } from './PracticeCategoryClient';
import type { QuestionClient, QuestionCategory } from '@/types';

interface Props {
  params: Promise<{ categoryId: string }>;
}

export default async function PracticeCategoryPage({ params }: Props) {
  const { categoryId } = await params;
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Validate category exists and is active
  const { data: category } = await supabase
    .from('question_categories')
    .select('*')
    .eq('id', categoryId)
    .eq('is_active', true)
    .single();

  if (!category) notFound();

  // Check premium status
  const { data: profile } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  const isPremium = ['premium', 'trial'].includes(profile?.subscription_status ?? '');
  if (!isPremium) redirect('/practice');

  // Fetch approved questions for this category (client-safe view — no correct_answer)
  const { data: questions } = await supabase
    .from('questions_client')
    .select(`
      id, category_id, question_nl, option_a, option_b, option_c,
      explanation_nl, explanation_en, explanation_ar, explanation_fa, explanation_tr,
      media_id, audio_media_id, difficulty,
      media:content_media!media_id (media_type, storage_path, mime_type, alt_text_nl),
      audio_media:content_media!audio_media_id (media_type, storage_path, mime_type)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'approved');

  if (!questions || questions.length < 15) {
    redirect('/practice');
  }

  // Shuffle and cap at 20 questions for section practice
  const shuffled = [...questions]
    .sort(() => Math.random() - 0.5)
    .slice(0, 20);

  return (
    <PracticeCategoryClient
      category={category as QuestionCategory}
      questions={shuffled as QuestionClient[]}
      userId={user.id}
    />
  );
}
