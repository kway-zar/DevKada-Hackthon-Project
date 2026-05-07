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
    patient_code?: string | null
    full_name?: string | null
    gender?: string | null
    blood_type?: string | null
    phone?: string | null
    date_of_birth?: string | null
    allergies?: string | null
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

  return {
    // Until real Supabase Auth JWT is implemented, use anon key to avoid invalid token 401s.
    accessToken: getAnonKey(),
    refreshToken: "",
    expiresAt: Date.now() + 3600000,
    userId: account.id,
    email: account.email,
    role: (account.account_type || 'patient') as AuthRole, // Assigned automatically by the DB trigger
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

export async function fetchQueueEntries(input: {
  queueDate: string
  facilityId?: string
}): Promise<QueueEntryDashboardRow[]> {
  const restBase = getRestApiBase()
  const params = new URLSearchParams({
    select:
      'id,facility_id,queue_date,queue_number,priority,priority_label,status,check_in_at,called_at,completed_at,estimated_wait_minutes,patients(patient_code,full_name,gender,blood_type,phone,date_of_birth,allergies),facilities(name),symptom_triage_assessments(symptoms_text,recommendation)',
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
  const params = new URLSearchParams({
    select: 'id,patient_code,first_name,last_name,full_name,date_of_birth,gender,phone,blood_type,allergies,medications,emergency_contact_name,emergency_contact_phone,created_at',
    or: `(qr_token.eq.${trimmed},patient_code.eq.${trimmed},id.eq.${trimmed})`,
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
