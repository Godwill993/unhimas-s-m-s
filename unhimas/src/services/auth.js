import { supabase } from '../lib/supabase';

/**
 * Ask the authenticated administrator-only Edge Function to invite and link
 * an existing student or lecturer record. The service-role key never enters
 * the frontend.
 */
export async function provisionSchoolAccount({ recordType, recordId }) {
	const { data, error } = await supabase.functions.invoke('provision-account', {
		body: { recordType, recordId },
	});

	if (error) {
		let message = error.message || 'Account invitation failed.';

		if (error.name === 'FunctionsFetchError') {
			message = 'Cannot reach the account invitation function. Confirm that "provision-account" is deployed to the Supabase project configured for this app, and that the project URL is correct.';
		}

		if (error.name === 'FunctionsRelayError') {
			message = 'Supabase could not route the account invitation request. Verify the deployed function name and Supabase project configuration.';
		}

		try {
			const response = error.context;
			const payload = response && typeof response.json === 'function' ? await response.json() : null;
			if (payload?.error) message = payload.error;
			else if (error.name === 'FunctionsHttpError' && response?.status) {
				message = `The invitation function returned HTTP ${response.status}. Check its Supabase Edge Function logs.`;
			}
		} catch {
			// Retain the Supabase error message if the response was not JSON.
		}
		throw new Error(message);
	}
	if (data?.error) throw new Error(data.error);
	return data;
}
