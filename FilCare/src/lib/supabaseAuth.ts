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

export interface ProviderQueueDashboardRow {
  id: string
  queue_date: string
  queue_number: number
  priority: 'P1' | 'P2' | 'P3'
  priority_label: string | null
  status: string
  check_in_at: string | null
  called_at: string | null
  completed_at: string | null
  estimated_wait_minutes: number | null
  patient_name: string
  patient_code: string | null
  gender: string | null
  blood_type: string | null
  facility_name: string | null
  symptoms_text: string | null
  recommendation: string | null
}

export interface QueueEntryDashboardRow {
  id: string
  facility_id: string
  patient_id?: string | null
  queue_date: string
  queue_number: number
  priority: 'P1' | 'P2' | 'P3'
  priority_label: string | null
  status: string
  check_in_at: string | null
  called_at: string | null
  completed_at: string | null
  estimated_wait_minutes: number | null
  patients?: {
    id?: string | null
    patient_code?: string | null
    full_name?: string | null
    gender?: string | null
    blood_type?: string | null
    phone?: string | null
    date_of_birth?: string | null
    allergies?: string | null
    bp?: string | null
    hr?: string | null
    temp?: string | null
    spo2?: string | null
  } | null
  facilities?: {
    name?: string | null
  } | null
  symptom_triage_assessments?: {
    symptoms_text?: string | null
    recommendation?: string | null
  } | null
}

export interface ProviderFacility {
  id: string
  name: string
}

export interface DoctorIdentity {
  fullName: string
  email: string
  role: AuthRole
  facilityName: string | null
}

export interface DoctorQueueAccess {
  scope: 'all' | 'facility'
  facilityId: string | null
  facilityName: string | null
  facilityLabel: string
  canChooseFacility: boolean
  availableFacilities: QueueFacility[]
}

export interface QueueFacility {
  id: string
  name: string
  facility_type?: string | null
  address_line1?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  phone?: string | null
  emergency_hotline?: string | null
  rating?: number | null
}

export interface PatientMedicalRecordRow {
  id: string
  patient_id: string
  facility_id: string | null
  category: string
  record_type: string
  title: string
  description: string | null
  status: string
  record_date: string
  file_name: string | null
  file_url: string | null
  mime_type: string | null
  created_at: string
  facility_name?: string | null
  provider_name?: string | null
}

type SelectableFacility = {
  id?: unknown
  name?: string
  type?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  phone?: string
  emergencyHotline?: string
  rating?: number
  acceptsP1?: boolean
  acceptsP2?: boolean
  acceptsP3?: boolean
}

export interface PatientQueueEntry {
  id: string
  facility_id: string
  patient_id: string
  queue_date: string
  queue_number: number
  priority: 'P1' | 'P2' | 'P3'
  priority_label: string | null
  status: string
  check_in_at: string | null
  estimated_wait_minutes: number | null
}

export interface RegisteredPatientRow {
  id: string
  patient_code?: string | null
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  date_of_birth?: string | null
  gender?: string | null
  phone?: string | null
  blood_type?: string | null
  allergies?: string | null
  medications?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  bp?: string | null
  hr?: string | null
  temp?: string | null
  spo2?: string | null
  created_at?: string | null
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

function isLikelyJwt(token?: string) {
  if (!token) return false
  const trimmed = token.trim()
  return trimmed.split('.').length === 3
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

export function logout(): void {
  // Clear JWT token and session from storage
  clearAuthSession()
  // Clear any other auth-related storage if needed
  window.localStorage.removeItem('filcare-jwt')
  window.localStorage.removeItem('filcare-user-data')
}

export async function signInWithPassword(email: string, password: string): Promise<AuthSession> {
  const restBase = getRestApiBase();
  
  // Query the custom accounts table instead of Supabase Auth
  const response = await fetch(
    `${restBase}/accounts?select=id,email,password_hash,account_type,patient_id,patients!accounts_patient_id_fkey(full_name)&email=eq.${encodeURIComponent(email.trim())}&limit=1`,
    { headers: getAuthHeaders() }
  );

  const data = await readJson<any>(response);
  if (!response.ok) {
    const message = (data && (data.message || data.hint)) || 'Unable to load account.';
    throw new Error(message);
  }

  const account = Array.isArray(data) ? data[0] : data;

  // Manual password check (In production, use a secure backend for hashing)[cite: 3]
  if (!account || account.password_hash !== password) {
    throw new Error('Invalid credentials.');
  }

  let profileFullName: string | null = null;
  try {
    const profileResponse = await fetch(
      `${restBase}/profiles?select=full_name&email=eq.${encodeURIComponent(email.trim())}&limit=1`,
      { headers: getAuthHeaders() }
    );
    const profilePayload = await readJson<any>(profileResponse);
    if (profileResponse.ok) {
      const profile = Array.isArray(profilePayload) ? profilePayload[0] : profilePayload;
      profileFullName = profile?.full_name || null;
    }
  } catch {
    profileFullName = null;
  }

  return {
    // Until real Supabase Auth JWT is implemented, use anon key to avoid invalid token 401s.
    accessToken: getAnonKey(),
    refreshToken: "",
    expiresAt: Date.now() + 3600000,
    userId: account.id,
    email: account.email,
    role: (account.account_type || 'patient') as AuthRole, // Assigned automatically by the DB trigger
    fullName: `Dr. ${profileFullName || account.patients?.full_name || account.email.split('@')[0] || 'Doctor'}`
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
    // Until real Supabase Auth JWT is implemented, use anon key to avoid invalid token 401s.
    accessToken: getAnonKey(),
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

export async function fetchProviderQueueDashboard(queueDate?: string): Promise<ProviderQueueDashboardRow[]> {
  const restBase = getRestApiBase()
  const session = loadAuthSession()
  const dateValue = queueDate || new Date().toISOString().slice(0, 10)
  const token = isLikelyJwt(session?.accessToken) ? session?.accessToken : undefined

  const params = new URLSearchParams({
    select: '*',
    queue_date: `eq.${dateValue}`,
    order: 'priority.asc,queue_number.asc',
  })

  const response = await fetch(`${restBase}/provider_queue_dashboard?${params.toString()}`, {
    headers: getAuthHeaders(token),
  })

  const payload = await readJson<any>(response)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.hint || 'Failed to load provider queue dashboard')
  }

  if (Array.isArray(payload) && payload.length > 0) return payload as ProviderQueueDashboardRow[]
  if (queueDate) return []

  const latestParams = new URLSearchParams({
    select: '*',
    order: 'queue_date.desc,priority.asc,queue_number.asc',
    limit: '50',
  })

  const latestResponse = await fetch(`${restBase}/provider_queue_dashboard?${latestParams.toString()}`, {
    headers: getAuthHeaders(token),
  })

  const latestPayload = await readJson<any>(latestResponse)
  if (!latestResponse.ok) {
    throw new Error(latestPayload?.message || latestPayload?.hint || 'Failed to load provider queue dashboard')
  }

  return Array.isArray(latestPayload) ? (latestPayload as ProviderQueueDashboardRow[]) : []
}

export async function fetchProviderFacility(): Promise<ProviderFacility | null> {
  const restBase = getRestApiBase()
  const session = loadAuthSession()
  if (!session?.userId) return null

  const accountParams = new URLSearchParams({
    select: 'provider_id,providers!accounts_provider_id_fkey(facility_id,facilities(name))',
    id: `eq.${session.userId}`,
    limit: '1',
  })
  const accountResponse = await fetch(`${restBase}/accounts?${accountParams.toString()}`, {
    headers: getAuthHeaders(),
  })
  const accountPayload = await readJson<any>(accountResponse)

  if (accountResponse.ok) {
    const account = Array.isArray(accountPayload) ? accountPayload[0] : accountPayload
    const facilityId = account?.providers?.facility_id
    if (facilityId) {
      return {
        id: facilityId,
        name: account?.providers?.facilities?.name || 'Assigned facility',
      }
    }
  }

  const providerParams = new URLSearchParams({
    select: 'facility_id,facilities(name)',
    user_id: `eq.${session.userId}`,
    limit: '1',
  })
  const providerResponse = await fetch(`${restBase}/providers?${providerParams.toString()}`, {
    headers: getAuthHeaders(),
  })
  const providerPayload = await readJson<any>(providerResponse)

  if (!providerResponse.ok) return null
  const provider = Array.isArray(providerPayload) ? providerPayload[0] : providerPayload
  if (!provider?.facility_id) return null

  return {
    id: provider.facility_id,
    name: provider?.facilities?.name || 'Assigned facility',
  }
}

export async function fetchDoctorIdentity(): Promise<DoctorIdentity | null> {
  const restBase = getRestApiBase()
  const session = loadAuthSession()
  if (!session?.userId) return null
  const doctorDisplayName = `Dr. ${session.email.split('@')[0] || 'Doctor'}`

  const profileParams = new URLSearchParams({
    select: 'full_name,role,email',
    user_id: `eq.${session.userId}`,
    limit: '1',
  })
  const profileResponse = await fetch(`${restBase}/profiles?${profileParams.toString()}`, {
    headers: getAuthHeaders(),
  })
  const profilePayload = await readJson<any>(profileResponse)
  if (profileResponse.ok) {
    const profile = Array.isArray(profilePayload) ? profilePayload[0] : profilePayload
    if (profile?.full_name) {
      const providerFacility = await fetchProviderFacility()
      return {
        fullName: doctorDisplayName,
        email: profile.email || session.email,
        role: (profile.role || session.role) as AuthRole,
        facilityName: providerFacility?.name || null,
      }
    }
  }

  const emailProfileParams = new URLSearchParams({
    select: 'full_name,role,email',
    email: `eq.${session.email}`,
    limit: '1',
  })
  const emailProfileResponse = await fetch(`${restBase}/profiles?${emailProfileParams.toString()}`, {
    headers: getAuthHeaders(),
  })
  const emailProfilePayload = await readJson<any>(emailProfileResponse)
  if (emailProfileResponse.ok) {
    const profile = Array.isArray(emailProfilePayload) ? emailProfilePayload[0] : emailProfilePayload
    if (profile?.full_name) {
      const providerFacility = await fetchProviderFacility()
      return {
        fullName: doctorDisplayName,
        email: profile.email || session.email,
        role: (profile.role || session.role) as AuthRole,
        facilityName: providerFacility?.name || null,
      }
    }
  }

  const accountParams = new URLSearchParams({
    select: 'email,account_type,providers!accounts_provider_id_fkey(facility_id,facilities(name))',
    id: `eq.${session.userId}`,
    limit: '1',
  })
  const accountResponse = await fetch(`${restBase}/accounts?${accountParams.toString()}`, {
    headers: getAuthHeaders(),
  })
  const accountPayload = await readJson<any>(accountResponse)
  if (accountResponse.ok) {
    const account = Array.isArray(accountPayload) ? accountPayload[0] : accountPayload
    const providerFacilityName = account?.providers?.facilities?.name || null
    if (account?.email) {
      return {
        fullName: doctorDisplayName,
        email: account.email,
        role: (account.account_type || session.role) as AuthRole,
        facilityName: providerFacilityName,
      }
    }
  }

  return {
    fullName: `Dr. ${session.email.split('@')[0] || 'Doctor'}`,
    email: session.email,
    role: session.role,
    facilityName: null,
  }
}

export async function fetchPatientMedicalRecords(input: {
  patientIdOrCode: string
  facilityId?: string | null
}): Promise<PatientMedicalRecordRow[]> {
  const restBase = getRestApiBase()
  const trimmed = input.patientIdOrCode.trim()
  if (!trimmed) return []

  let patientId = trimmed
  if (!isUuid(trimmed)) {
    const patientLookup = await fetchPatientByQrValue(trimmed)
    if (!patientLookup) return []
    patientId = patientLookup.id
  }

  const params = new URLSearchParams({
    select:
      'id,patient_id,facility_id,provider_id,appointment_id,category,record_type,title,description,status,record_date,file_name,file_url,mime_type,created_at,facilities(name)',
    patient_id: `eq.${patientId}`,
    order: 'record_date.desc,created_at.desc',
    limit: '20',
  })

  if (input.facilityId) {
    params.set('facility_id', `eq.${input.facilityId}`)
  }

  const response = await fetch(`${restBase}/medical_records?${params.toString()}`, {
    headers: getAuthHeaders(),
  })
  const payload = await readJson<any>(response)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.hint || 'Failed to load medical records')
  }

  return Array.isArray(payload)
    ? payload.map((item) => ({
        ...item,
        facility_name: item.facilities?.name || null,
        provider_name: null,
      })) as PatientMedicalRecordRow[]
    : []
}

export async function fetchQueueEntries(input: {
  queueDate: string
  facilityId?: string
}): Promise<QueueEntryDashboardRow[]> {
  const restBase = getRestApiBase()
  const params = new URLSearchParams({
    select:
      'id,facility_id,patient_id,queue_date,queue_number,priority,priority_label,status,check_in_at,called_at,completed_at,estimated_wait_minutes,patients(id,patient_code,full_name,gender,blood_type,phone,date_of_birth,allergies,bp,hr,temp,spo2),facilities(name),symptom_triage_assessments(symptoms_text,recommendation)',
    queue_date: `eq.${input.queueDate}`,
    order: 'priority.asc,queue_number.asc',
  })

  if (input.facilityId) {
    params.set('facility_id', `eq.${input.facilityId}`)
  }

  const response = await fetch(`${restBase}/queue_entries?${params.toString()}`, {
    headers: getAuthHeaders(),
  })
  const payload = await readJson<any>(response)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.hint || 'Failed to load queue entries')
  }

  return Array.isArray(payload) ? (payload as QueueEntryDashboardRow[]) : []
}

export async function updateQueueEntryStatus(input: {
  queueEntryId: string
  status: 'waiting' | 'in_progress' | 'called' | 'completed' | 'cancelled'
}) {
  const restBase = getRestApiBase()
  const body: Record<string, unknown> = {
    status: input.status,
  }

  if (input.status === 'called') body.called_at = new Date().toISOString()
  if (input.status === 'completed') body.completed_at = new Date().toISOString()

  const response = await fetch(`${restBase}/queue_entries?id=eq.${encodeURIComponent(input.queueEntryId)}`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  })

  const payload = await readJson<any>(response)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.hint || 'Failed to update queue entry')
  }
}

export async function deleteQueueEntry(queueEntryId: string) {
  const restBase = getRestApiBase()
  const params = new URLSearchParams({
    id: `eq.${queueEntryId}`,
    select: 'id',
  })
  const response = await fetch(`${restBase}/queue_entries?${params.toString()}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
      Prefer: 'return=representation',
    },
  })

  const payload = await readJson<any>(response)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.hint || 'Failed to delete queue entry')
  }

  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('Queue entry was not deleted. Check Supabase delete policy for queue_entries.')
  }
}

export async function updatePatientVitals(input: {
  patientId: string
  vitals: {
    bp: string
    hr: string
    temp: string
    spo2: string
  }
}) {
  const restBase = getRestApiBase()
  const response = await fetch(`${restBase}/patients?id=eq.${encodeURIComponent(input.patientId)}`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      bp: input.vitals.bp || null,
      hr: input.vitals.hr || null,
      temp: input.vitals.temp || null,
      spo2: input.vitals.spo2 || null,
    }),
  })

  const payload = await readJson<any>(response)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.hint || 'Failed to update patient vitals')
  }
}

export async function fetchRegisteredPatients(): Promise<RegisteredPatientRow[]> {
  const restBase = getRestApiBase()
  const params = new URLSearchParams({
    select: 'id,patient_code,first_name,last_name,full_name,date_of_birth,gender,phone,blood_type,allergies,medications,emergency_contact_name,emergency_contact_phone,created_at',
    order: 'created_at.desc',
    limit: '50',
  })

  const response = await fetch(`${restBase}/patients?${params.toString()}`, {
    headers: getAuthHeaders(),
  })

  const payload = await readJson<any>(response)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.hint || 'Failed to load registered patients')
  }

  return Array.isArray(payload) ? (payload as RegisteredPatientRow[]) : []
}

export async function fetchPatientByQrValue(value: string): Promise<RegisteredPatientRow | null> {
  const trimmed = value.trim()
  if (!trimmed) return null

  const restBase = getRestApiBase()
  // Prefer patient_code for queue/portal lookups; only touch qr_token when the input is a real UUID.
  const filters = [`patient_code.eq.${trimmed}`]
  if (isUuid(trimmed)) {
    filters.unshift(`qr_token.eq.${trimmed}`)
    filters.push(`id.eq.${trimmed}`)
  }
  const params = new URLSearchParams({
    select: 'id,patient_code,first_name,last_name,full_name,date_of_birth,gender,phone,blood_type,allergies,medications,emergency_contact_name,emergency_contact_phone,created_at',
    or: `(${filters.join(',')})`,
    limit: '1',
  })

  const response = await fetch(`${restBase}/patients?${params.toString()}`, {
    headers: getAuthHeaders(),
  })

  const payload = await readJson<any>(response)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.hint || 'Failed to load patient QR record')
  }

  return Array.isArray(payload) && payload[0] ? (payload[0] as RegisteredPatientRow) : null
}

export async function fetchPatientById(id: string): Promise<RegisteredPatientRow | null> {
  const trimmed = id.trim()
  if (!trimmed || !isUuid(trimmed)) return null

  const restBase = getRestApiBase()
  const params = new URLSearchParams({
    select: 'id,patient_code,first_name,last_name,full_name,date_of_birth,gender,phone,blood_type,allergies,medications,emergency_contact_name,emergency_contact_phone,created_at',
    id: `eq.${trimmed}`,
    limit: '1',
  })

  const response = await fetch(`${restBase}/patients?${params.toString()}`, {
    headers: getAuthHeaders(),
  })

  const payload = await readJson<any>(response)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.hint || 'Failed to load patient record')
  }

  return Array.isArray(payload) && payload[0] ? (payload[0] as RegisteredPatientRow) : null
}

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function parseEstimatedWaitMinutes(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value !== 'string') return null
  const numberMatch = value.match(/\d+/)
  if (!numberMatch) return null
  return Math.max(0, Number(numberMatch[0]))
}

async function fetchFacilityById(id: string): Promise<QueueFacility> {
  const restBase = getRestApiBase()
  const params = new URLSearchParams({
    select: 'id,name,facility_type,address_line1,city,state,postal_code,phone,emergency_hotline,rating',
    id: `eq.${id}`,
    limit: '1',
  })
  const response = await fetch(`${restBase}/facilities?${params.toString()}`, {
    headers: getAuthHeaders(),
  })
  const payload = await readJson<any>(response)
  if (!response.ok || !Array.isArray(payload) || !payload[0]) {
    throw new Error(payload?.message || payload?.hint || 'Unable to load selected facility')
  }
  return payload[0] as QueueFacility
}

export async function fetchQueueFacilities(): Promise<QueueFacility[]> {
  const restBase = getRestApiBase()
  const params = new URLSearchParams({
    select: 'id,name,facility_type,address_line1,city,state,postal_code,phone,emergency_hotline,rating',
    active: 'eq.true',
    order: 'name.asc',
  })

  const response = await fetch(`${restBase}/facilities?${params.toString()}`, {
    headers: getAuthHeaders(),
  })
  const payload = await readJson<any>(response)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.hint || 'Unable to load facilities')
  }

  return Array.isArray(payload) ? (payload as QueueFacility[]) : []
}

function normalizeDoctorEmail(email?: string | null) {
  const value = (email || '').trim().toLowerCase()
  const [localPart = '', domain = ''] = value.split('@')
  return { email: value, localPart, domain }
}

function facilityNameMatchesToken(facilityName: string, token: string) {
  const normalizedFacility = facilityName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const normalizedToken = token.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  if (!normalizedFacility || !normalizedToken) return false
  return normalizedFacility.includes(normalizedToken) || normalizedToken.includes(normalizedFacility)
}

function resolveFacilityAlias(email: string, facilities: QueueFacility[]) {
  const { localPart, domain } = normalizeDoctorEmail(email)
  const emailTokens = [localPart, domain, email.toLowerCase()]

  const aliases = [
    {
      facilityName: 'Makati Medical Center',
      tokens: ['mh.ph', 'makati', 'makati medical center', 'mmc'],
    },
    {
      facilityName: 'Boston Medical Center',
      tokens: ['bmc.ph', 'boston', 'boston medical center'],
    },
  ]

  for (const alias of aliases) {
    const matchedToken = alias.tokens.find((token) =>
      emailTokens.some((emailToken) => emailToken.includes(token))
    )

    if (!matchedToken) continue

    const facility =
      facilities.find((item) => facilityNameMatchesToken(item.name, alias.facilityName)) ||
      facilities.find((item) => facilityNameMatchesToken(item.name, matchedToken)) ||
      facilities.find((item) => facilityNameMatchesToken(item.name, alias.tokens[0]))

    if (facility) {
      return {
        scope: 'facility' as const,
        facilityId: facility.id,
        facilityName: facility.name,
        facilityLabel: facility.name,
        canChooseFacility: false,
      }
    }
  }

  return null
}

export async function resolveDoctorQueueAccess(): Promise<DoctorQueueAccess> {
  const session = loadAuthSession()
  const availableFacilities = await fetchQueueFacilities()
  const email = session?.email || ''

  const aliasMatch = resolveFacilityAlias(email, availableFacilities)
  if (aliasMatch) {
    return {
      ...aliasMatch,
      availableFacilities,
    }
  }

  const providerFacility = await fetchProviderFacility()
  if (providerFacility) {
    const matchedFacility =
      availableFacilities.find((facility) => facility.id === providerFacility.id) ||
      availableFacilities.find((facility) => facilityNameMatchesToken(facility.name, providerFacility.name))

    if (matchedFacility) {
      return {
        scope: 'facility',
        facilityId: matchedFacility.id,
        facilityName: matchedFacility.name,
        facilityLabel: matchedFacility.name,
        canChooseFacility: false,
        availableFacilities,
      }
    }
  }

  return {
    scope: 'all',
    facilityId: null,
    facilityName: null,
    facilityLabel: 'All Facilities',
    canChooseFacility: true,
    availableFacilities,
  }
}

function splitFacilityAddress(address?: string) {
  const parts = (address || '').split(',').map((part) => part.trim()).filter(Boolean)
  return {
    addressLine1: parts[0] || address || 'Address not provided',
    city: parts[1] || 'Unknown',
    state: parts[2]?.split(/\s+/)[0] || 'N/A',
    postalCode: parts[2]?.split(/\s+/).slice(1).join(' ') || null,
  }
}

async function createSelectableFacility(facility: SelectableFacility, priority: 'P1' | 'P2' | 'P3') {
  const restBase = getRestApiBase()
  const address = splitFacilityAddress(facility.address)
  const isHospital = facility.type === 'Hospital' || priority === 'P1'
  const payload = {
    name: facility.name || 'Selected Facility',
    facility_type: isHospital ? 'hospital' : 'clinic',
    address_line1: address.addressLine1,
    city: address.city,
    state: address.state,
    postal_code: address.postalCode,
    phone: facility.phone && facility.phone !== 'N/A' ? facility.phone : 'N/A',
    emergency_hotline: facility.emergencyHotline || '911',
    rating: typeof facility.rating === 'number' ? facility.rating : null,
    accepts_p1: facility.acceptsP1 ?? isHospital,
    accepts_p2: facility.acceptsP2 ?? true,
    accepts_p3: facility.acceptsP3 ?? true,
    active: true,
  }

  const response = await fetch(`${restBase}/facilities`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  })
  const responsePayload = await readJson<any>(response)
  if (!response.ok || !Array.isArray(responsePayload) || !responsePayload[0]?.id) {
    throw new Error(
      responsePayload?.message ||
        responsePayload?.hint ||
        'Unable to create selected facility. Allow insert on facilities or seed facilities in Supabase.'
    )
  }

  return responsePayload[0] as QueueFacility
}

async function resolveFacility(facility: SelectableFacility, priority: 'P1' | 'P2' | 'P3') {
  if (isUuid(facility.id)) return fetchFacilityById(String(facility.id))

  const restBase = getRestApiBase()
  const name = facility.name?.trim()

  if (name) {
    const byNameParams = new URLSearchParams({
      select: 'id,name,facility_type,address_line1,city,state,postal_code,phone,emergency_hotline,rating',
      name: `eq.${name}`,
      limit: '1',
    })
    const byNameResponse = await fetch(`${restBase}/facilities?${byNameParams.toString()}`, {
      headers: getAuthHeaders(),
    })
    const byNamePayload = await readJson<any>(byNameResponse)
    if (byNameResponse.ok && Array.isArray(byNamePayload) && byNamePayload[0]?.id) {
      return byNamePayload[0] as QueueFacility
    }
  }

  return createSelectableFacility(facility, priority)
}

export async function createTriageQueueEntry(input: {
  patientId: string
  facility: SelectableFacility
  triageData: {
    symptoms?: string
    selectedSymptoms?: string[]
    duration?: string
    severity?: string
    priority?: 'P1' | 'P2' | 'P3'
    priorityLabel?: string
    estimatedWait?: string
    recommendation?: string
    analysis?: string
  }
}) {
  const restBase = getRestApiBase()
  const priority = input.triageData.priority || 'P3'
  const priorityLabel = input.triageData.priorityLabel || 'Non-Urgent'
  const resolvedFacility = await resolveFacility(input.facility, priority)
  const facilityId = resolvedFacility.id
  const headers = {
    ...getAuthHeaders(),
    Prefer: 'return=representation',
  }

  const triageResponse = await fetch(`${restBase}/symptom_triage_assessments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      patient_id: input.patientId,
      // The app currently uses a custom accounts table, not Supabase auth.users.
      // Leaving this null avoids violating the auth.users foreign key.
      created_by_user_id: null,
      symptoms_text: input.triageData.symptoms || '',
      selected_symptoms: input.triageData.selectedSymptoms || [],
      duration: input.triageData.duration || null,
      severity: input.triageData.severity || null,
      priority,
      priority_label: priorityLabel,
      estimated_wait: input.triageData.estimatedWait || null,
      recommendation: input.triageData.recommendation || 'No recommendation recorded',
      ai_analysis: input.triageData.analysis || 'No analysis recorded',
    }),
  })

  const triagePayload = await readJson<any>(triageResponse)
  if (!triageResponse.ok) {
    throw new Error(triagePayload?.message || triagePayload?.hint || 'Unable to save triage assessment')
  }

  const triageRow = Array.isArray(triagePayload) ? triagePayload[0] : triagePayload
  if (!triageRow?.id) throw new Error('Triage assessment was saved without an id')

  const queueNumberResponse = await fetch(`${restBase}/rpc/next_queue_number`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      p_facility_id: facilityId,
      p_queue_date: new Date().toISOString().slice(0, 10),
    }),
  })
  const queueNumberPayload = await readJson<any>(queueNumberResponse)
  if (!queueNumberResponse.ok) {
    throw new Error(queueNumberPayload?.message || queueNumberPayload?.hint || 'Unable to create queue number')
  }

  const queueResponse = await fetch(`${restBase}/queue_entries`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      facility_id: facilityId,
      patient_id: input.patientId,
      triage_assessment_id: triageRow.id,
      queue_date: new Date().toISOString().slice(0, 10),
      queue_number: Number(queueNumberPayload),
      priority,
      priority_label: priorityLabel,
      status: 'waiting',
      estimated_wait_minutes: parseEstimatedWaitMinutes(input.triageData.estimatedWait),
    }),
  })

  const queuePayload = await readJson<any>(queueResponse)
  if (!queueResponse.ok) {
    throw new Error(queuePayload?.message || queuePayload?.hint || 'Unable to create queue entry')
  }

  return {
    triage: triageRow,
    queue: Array.isArray(queuePayload) ? queuePayload[0] : queuePayload,
    facility: resolvedFacility,
  }
}

export async function fetchPatientQueueStatus(queueEntryId: string): Promise<{
  queue: PatientQueueEntry
  facility: QueueFacility
  peopleAhead: number
  nowServing: number
}> {
  const restBase = getRestApiBase()
  const queueParams = new URLSearchParams({
    select: 'id,facility_id,patient_id,queue_date,queue_number,priority,priority_label,status,check_in_at,estimated_wait_minutes,facilities(id,name,facility_type,address_line1,city,state,postal_code,phone,emergency_hotline,rating)',
    id: `eq.${queueEntryId}`,
    limit: '1',
  })

  const queueResponse = await fetch(`${restBase}/queue_entries?${queueParams.toString()}`, {
    headers: getAuthHeaders(),
  })
  const queuePayload = await readJson<any>(queueResponse)
  if (!queueResponse.ok || !Array.isArray(queuePayload) || !queuePayload[0]) {
    throw new Error(queuePayload?.message || queuePayload?.hint || 'Unable to load patient queue status')
  }

  const row = queuePayload[0]
  const queue = {
    id: row.id,
    facility_id: row.facility_id,
    patient_id: row.patient_id,
    queue_date: row.queue_date,
    queue_number: row.queue_number,
    priority: row.priority,
    priority_label: row.priority_label,
    status: row.status,
    check_in_at: row.check_in_at,
    estimated_wait_minutes: row.estimated_wait_minutes,
  } as PatientQueueEntry

  const aheadParams = new URLSearchParams({
    select: 'id,queue_number,status',
    facility_id: `eq.${queue.facility_id}`,
    queue_date: `eq.${queue.queue_date}`,
    queue_number: `lt.${queue.queue_number}`,
    status: 'in.(waiting,called,in_progress)',
  })
  const aheadResponse = await fetch(`${restBase}/queue_entries?${aheadParams.toString()}`, {
    headers: getAuthHeaders(),
  })
  const aheadPayload = await readJson<any>(aheadResponse)
  if (!aheadResponse.ok) {
    throw new Error(aheadPayload?.message || aheadPayload?.hint || 'Unable to load queue position')
  }

  const peopleAhead = Array.isArray(aheadPayload) ? aheadPayload.length : 0

  return {
    queue,
    facility: row.facilities as QueueFacility,
    peopleAhead,
    nowServing: Math.max(1, queue.queue_number - peopleAhead),
  }
}

export async function fetchPatientActiveQueue(userId: string): Promise<{
  queueEntry: PatientQueueEntry | null
  facility: QueueFacility | null
}> {
  const restBase = getRestApiBase()

  try {
    // First, get the patient_id for this userId
    const patientParams = new URLSearchParams({
      select: 'id',
      user_id: `eq.${userId}`,
      limit: '1',
    })

    const patientResponse = await fetch(`${restBase}/patients?${patientParams.toString()}`, {
      headers: getAuthHeaders(),
    })

    const patientPayload = await readJson<any>(patientResponse)
    if (!patientResponse.ok) {
      throw new Error(patientPayload?.message || patientPayload?.hint || 'Unable to fetch patient')
    }

    const patient = Array.isArray(patientPayload) ? patientPayload[0] : patientPayload
    if (!patient?.id) {
      return { queueEntry: null, facility: null }
    }

    const patientId = patient.id

    // Now query for active queue entries for this patient
    const queueParams = new URLSearchParams({
      select: '*,facilities(*)',
      patient_id: `eq.${patientId}`,
      status: `in.(waiting,in_progress,called)`,
      order: 'created_at.desc',
      limit: '1',
    })

    const queueResponse = await fetch(`${restBase}/queue_entries?${queueParams.toString()}`, {
      headers: getAuthHeaders(),
    })

    const queuePayload = await readJson<any>(queueResponse)
    if (!queueResponse.ok) {
      throw new Error(queuePayload?.message || queuePayload?.hint || 'Unable to fetch queue entry')
    }

    const queueEntry = Array.isArray(queuePayload) ? queuePayload[0] : null
    if (!queueEntry) {
      return { queueEntry: null, facility: null }
    }

    return {
      queueEntry: queueEntry as PatientQueueEntry,
      facility: (queueEntry.facilities || null) as QueueFacility | null,
    }
  } catch (error) {
    return { queueEntry: null, facility: null }
  }
}
