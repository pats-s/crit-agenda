// Public values: safe to ship inside the app. Security comes from the database's
// row-level security rules (supabase/schema.sql), not from hiding these two.
// Never put the secret / service_role key here or anywhere in this repository.
// Shows the "Create an account" option on the sign-in screen. Whether new accounts are actually
// accepted is decided by the switch "Allow new users to sign up" in the Supabase dashboard.
export const ALLOW_SIGNUP = true
export const SUPABASE_URL = 'https://twxfwqnkjuxxjbyrrgrq.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_LwiUCEhLrU47SAiRl6mTiw_Q_2blV_T'
