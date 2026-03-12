import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PracticeClient } from './PracticeClient';
import type { QuestionCategory } from '@/types';

export default async function PracticePage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Get categories with question counts
  const { data: categories } = await supabase
    .from('question_categories')
    .select('*')
    .order('display_order');

  // Count approved questions per category
  const { data: counts } = await supabase
    .from('questions')
    .select('category_id')
    .eq('status', 'approved');

  const countMap: Record<string, number> = {};
  (counts ?? []).forEach((q) => {
    countMap[q.category_id] = (countMap[q.category_id] ?? 0) + 1;
  });

  return (
    <PracticeClient
      categories={(categories ?? []) as QuestionCategory[]}
      questionCounts={countMap}
    />
  );
}
