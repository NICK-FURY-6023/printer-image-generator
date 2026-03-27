const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
    supabase = createClient(url, key);
  }
  return supabase;
}

// Check if error is "table not found" — means user hasn't run setup SQL yet
function isTableMissing(error) {
  return error?.code === 'PGRST205' || error?.code === '42P01' ||
    (error?.message || '').includes('does not exist');
}

const TABLE_MISSING_MSG = 'Templates table not found. Run the setup SQL in Supabase Dashboard — see scripts/setup-db.sql';

const db = {
  async listTemplates() {
    const sb = getSupabase();
    const { data, error } = await sb.from('templates').select('*').order('created_at', { ascending: false });
    if (error) {
      if (isTableMissing(error)) return []; // graceful: return empty list
      throw new Error(error.message);
    }
    return data || [];
  },

  async getTemplate(id) {
    const sb = getSupabase();
    const { data, error } = await sb.from('templates').select('*').eq('id', id).single();
    if (error) {
      if (isTableMissing(error)) throw new Error(TABLE_MISSING_MSG);
      throw new Error(error.message || 'Not found');
    }
    return data;
  },

  async createTemplate(name, label_data) {
    const sb = getSupabase();
    const { data, error } = await sb.from('templates').insert([{ name, label_data }]).select().single();
    if (error) {
      if (isTableMissing(error)) throw new Error(TABLE_MISSING_MSG);
      throw new Error(error.message);
    }
    return data;
  },

  async updateTemplate(id, name, label_data) {
    const sb = getSupabase();
    const { data, error } = await sb.from('templates').update({ name, label_data }).eq('id', id).select().single();
    if (error) {
      if (isTableMissing(error)) throw new Error(TABLE_MISSING_MSG);
      throw new Error(error.message);
    }
    return data;
  },

  async deleteTemplate(id) {
    const sb = getSupabase();
    const { error } = await sb.from('templates').delete().eq('id', id);
    if (error) {
      if (isTableMissing(error)) throw new Error(TABLE_MISSING_MSG);
      throw new Error(error.message);
    }
  },
};

module.exports = { db };
