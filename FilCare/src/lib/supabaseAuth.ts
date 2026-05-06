export type AuthRole = 'patient' | 'provider'

export interface AuthSession {
  accessToken: string
  refreshToken: string
  expiresAt: number | null
  userId: string
  email: string
  role: AuthRole
  fullName: string
}



const DEFAULT_REST_API = 'https://mhahfguiqnaczorujmhd.supabase.co/rest/v1/'

function getRestApiBase() {
  return (
    (import.meta.env.VITE_SUPABASE_REST_API as string | undefined)?.trim() ||
    DEFAULT_REST_API
  ).replace(/\/$/, '')
}



function getAnonKey() {
  return (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || ''
}

function getAuthHeaders(accessToken?: string) {
  const anonKey = getAnonKey()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (anonKey) {
    headers.apikey = anonKey
    headers.Authorization = `Bearer ${accessToken || anonKey}`
  } else if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}


async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) return {} as T
  return JSON.parse(text) as T
}

export function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem('filcare-auth-session', JSON.stringify(session))
}

export function loadAuthSession(): AuthSession | null {
  const raw = window.localStorage.getItem('filcare-auth-session')
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function clearAuthSession() {
  window.localStorage.removeItem('filcare-auth-session')
}

export async function signInWithPassword(email: string, password: string): Promise<AuthSession> {
  const restBase = getRestApiBase();
  
  // Query the custom accounts table instead of Supabase Auth
  const response = await fetch(
    `${restBase}/accounts?select=*,patients(full_name),providers(specialty)&email=eq.${encodeURIComponent(email)}`,
    { headers: getAuthHeaders() }
  );

  const data = await readJson<any[]>(response);
  const account = data[0];

  // Manual password check (In production, use a secure backend for hashing)[cite: 3]
  if (!account || account.password_hash !== password) {
    throw new Error('Invalid credentials.');
  }

  return {
    accessToken: "YOUR_CUSTOM_GENERATED_JWT", 
    refreshToken: "",
    expiresAt: Date.now() + 3600000,
    userId: account.id,
    email: account.email,
    role: account.account_type, // Assigned automatically by the DB trigger
    fullName: account.patients?.full_name || "Staff Member"
  };
}

export async function signUpWithPassword(input: {
  email: string
  password: string
  fullName: string
}): Promise<AuthSession | null> {
  const restApiBase = getRestApiBase();

  // Insert into accounts first[cite: 3]
  // patient_id is left blank; the DB will fill id and account_type
  const response = await fetch(`${restApiBase}/accounts`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Prefer': 'return=representation', 
    },
    body: JSON.stringify({
      email: input.email,
      password_hash: input.password, 
    }),
  });

  const payload = await readJson<any>(response);
  if (!response.ok) throw new Error(payload.message || 'Signup failed');

  const newAccount = Array.isArray(payload) ? payload[0] : payload;

  // Now create the profile using the auto-generated account ID
  await fetch(`${restApiBase}/profiles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      user_id: newAccount.id, // Linking the account to the profile[cite: 2]
      email: input.email,
      full_name: input.fullName,
      role: newAccount.account_type, 
    }),
  });

  return {
    accessToken: "CUSTOM_JWT_TOKEN",
    refreshToken: "",
    expiresAt: Date.now() + 3600000,
    userId: newAccount.id,
    email: newAccount.email,
    role: newAccount.account_type,
    fullName: input.fullName,
  };
}
export function isAuthSessionExpired(session: AuthSession) {
  return session.expiresAt !== null && Date.now() >= session.expiresAt
}