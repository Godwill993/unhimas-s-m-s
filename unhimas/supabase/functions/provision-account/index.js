import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return jsonResponse({ error: 'Authentication is required.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Account provisioning is not configured on the server.' }, 500);
  }

  const accessToken = authorization.slice('Bearer '.length);
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await callerClient.auth.getUser(accessToken);
  if (authError || !authData.user) return jsonResponse({ error: 'Your session is invalid or expired.' }, 401);

  const { data: callerProfile, error: profileError } = await callerClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', authData.user.id)
    .single();

  if (profileError || callerProfile?.role !== 'admin' || !callerProfile.is_active) {
    return jsonResponse({ error: 'Only an active administrator can invite accounts.' }, 403);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
  }

  const { recordType, recordId } = input || {};
  if (!['student', 'lecturer'].includes(recordType) || typeof recordId !== 'string') {
    return jsonResponse({ error: 'Choose an existing student or lecturer record.' }, 400);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(recordId)) {
    return jsonResponse({ error: 'The selected school record ID is invalid.' }, 400);
  }

  const table = recordType === 'student' ? 'students' : 'lecturers';
  const { data: schoolRecord, error: recordError } = await adminClient
    .from(table)
    .select('id, profile_id, email, is_active, first_name, last_name, matricule, staff_id')
    .eq('id', recordId)
    .maybeSingle();

  if (recordError) return jsonResponse({ error: 'Could not verify the selected school record.' }, 500);
  if (!schoolRecord) return jsonResponse({ error: 'The selected school record was not found.' }, 404);
  if (!schoolRecord.is_active) return jsonResponse({ error: 'Activate this school record before inviting its user.' }, 409);
  if (schoolRecord.profile_id) return jsonResponse({ error: 'This school record is already linked to a login account.' }, 409);
  if (!schoolRecord.email?.trim()) return jsonResponse({ error: 'Add an email address to this school record before inviting the user.' }, 400);

  const fullName = `${schoolRecord.first_name} ${schoolRecord.last_name}`.trim();
  const loginId = recordType === 'student' ? schoolRecord.matricule : schoolRecord.staff_id;
  const appBaseUrl = Deno.env.get('APP_BASE_URL');
  const redirectTo = appBaseUrl ? `${appBaseUrl.replace(/\/$/, '')}/` : undefined;

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    schoolRecord.email.trim(),
    {
      data: { full_name: fullName, login_id: loginId },
      ...(redirectTo ? { redirectTo } : {}),
    },
  );

  if (inviteError || !invited.user) {
    return jsonResponse({ error: inviteError?.message || 'Supabase Auth did not create the invitation.' }, 400);
  }

  const { error: linkError } = await adminClient.rpc('link_provisioned_school_account', {
    p_user_id: invited.user.id,
    p_record_type: recordType,
    p_record_id: schoolRecord.id,
  });

  if (linkError) {
    const { error: cleanupError } = await adminClient.auth.admin.deleteUser(invited.user.id);
    if (cleanupError) {
      return jsonResponse({
        error: 'The school record could not be linked, and the temporary Auth account could not be removed. Contact the system administrator before retrying.',
      }, 500);
    }
    return jsonResponse({ error: `Invitation setup failed; the temporary Auth account was removed. ${linkError.message}` }, 409);
  }

  return jsonResponse({
    success: true,
    message: `An account setup invitation was sent to ${schoolRecord.email.trim()}.`,
    recordType,
    recordId: schoolRecord.id,
  });
});
