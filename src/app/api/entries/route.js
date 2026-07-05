import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function getSafeSupabase() {
  try {
    return { client: getSupabase(), error: null };
  } catch (e) {
    return {
      client: null,
      error: Response.json(
        { error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' },
        { status: 503 }
      ),
    };
  }
}

export async function GET(request) {
  const { client: supabase, error: configError } = getSafeSupabase();
  if (configError) return configError;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Get total count
  const { count, error: countError } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return Response.json({ error: countError.message }, { status: 500 });
  }

  const totalPages = count || 0;

  if (totalPages === 0) {
    return Response.json({
      entry: null,
      currentPage: 0,
      totalPages: 0,
    });
  }

  // Clamp page number
  const currentPage = Math.max(1, Math.min(page, totalPages));

  // Fetch the entry for the requested page (ordered by date ASC, 1 per page)
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('date', { ascending: true })
    .range(currentPage - 1, currentPage - 1)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    entry: data,
    currentPage,
    totalPages,
  });
}

export async function POST(request) {
  const { client: supabase, error: configError } = getSafeSupabase();
  if (configError) return configError;

  const body = await request.json();
  const { text, date } = body;

  if (!text || !text.trim()) {
    return Response.json({ error: 'Text is required' }, { status: 400 });
  }

  // Use provided date or fallback to server date
  const entryDate = date || new Date().toISOString().split('T')[0];
  const trimmedText = text.trim();

  // Check if an entry exists for this date
  const { data: existing, error: fetchError } = await supabase
    .from('entries')
    .select('*')
    .eq('date', entryDate)
    .maybeSingle();

  if (fetchError) {
    return Response.json({ error: fetchError.message }, { status: 500 });
  }

  if (existing) {
    // Append to existing entry with separator
    const updatedContent = existing.content + '\n\n---\n\n' + trimmedText;

    const { data, error } = await supabase
      .from('entries')
      .update({
        content: updatedContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ entry: data, appended: true });
  } else {
    // Create new entry
    const { data, error } = await supabase
      .from('entries')
      .insert({
        date: entryDate,
        content: trimmedText,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ entry: data, appended: false }, { status: 201 });
  }
}
