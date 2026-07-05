import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  let supabase;
  try {
    supabase = getSupabase();
  } catch {
    return Response.json(
      { error: 'Supabase is not configured.' },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from('entries')
    .select('date')
    .order('date', { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    dates: data.map((entry, index) => ({
      date: entry.date,
      page: index + 1,
    })),
  });
}
