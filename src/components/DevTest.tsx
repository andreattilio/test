import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DevTest() {
  const [userId, setUserId] = useState<string | null>(null);

  async function signIn() {
    const email = prompt('Email:')?.trim();
    const password = prompt('Password:') ?? '';
    if (!email || !password) return;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    setUserId(data.user?.id ?? null);
    alert('Signed in');
  }

  async function addTestFeed() {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return alert('Sign in first');
    const { error } = await supabase.from('entries').insert({
      account_id: uid, event: 'feed_formula', value: 120, unit: 'ml',
      started_at: new Date().toISOString()
    });
    if (error) alert(error.message); else alert('Saved!');
  }

  return (
    <div style={{ padding:12, border:'1px solid #ccc', margin:12 }}>
      <div>User: {userId ?? '(not signed in)'}</div>
      <button onClick={signIn}>Sign in</button>
      <button onClick={addTestFeed} style={{ marginLeft:8 }}>Add test feed</button>
    </div>
  );
}
