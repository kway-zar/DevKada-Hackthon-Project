const DEFAULT_REST_API = 'https://mhahfguiqnaczorujmhd.supabase.co/rest/v1'
const LOCAL_PATIENTS_KEY = 'filcare-patient-records'
const LOCAL_QUEUE_KEY = 'filcare-queue-records'

type RecordLike = Record<string, unknown>

function getRestApiBase() {
  return (
    (import.meta.env.VITE_SUPABASE_REST_API as string | undefined)?.trim() ||
    DEFAULT_REST_API
  ).replace(/\/$/, '')
}

function getAnonKey() {
  return (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || ''
}

function getHeaders() {
  const anon = getAnonKey()
  return {
    'Content-Type': 'application/json',
    apikey: anon,
    Authorization: `Bearer ${anon}`,
  }
}

function readLocal<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocal<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

async function tryInsert(table: string, payload: RecordLike): Promise<RecordLike | null> {
  try {
    const res = await fetch(`${getRestApiBase()}/${table}`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? data[0] : data
  } catch {
    return null
  }
}

async function tryList(table: string): Promise<RecordLike[] | null> {
  try {
    const res = await fetch(`${getRestApiBase()}/${table}?select=*`, {
      headers: getHeaders(),
    })
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return null
  }
}

export async function savePatientRecord(record: RecordLike) {
  const local = readLocal<RecordLike>(LOCAL_PATIENTS_KEY)
  // Store locally for instant UI + fallback if inserts fail due to RLS.
  writeLocal(LOCAL_PATIENTS_KEY, [{ ...record, source: 'local' }, ...local].slice(0, 200))

  const payload = {
    first_name: record.firstName ?? record.first_name,
    last_name: record.lastName ?? record.last_name,
    date_of_birth: record.dateOfBirth ?? record.date_of_birth,
    gender: record.gender,
    blood_type: record.bloodType ?? record.blood_type,
    phone: record.phone,
    email: record.email ?? null,
    address: record.address,
    city: record.city,
    zip_code: record.zipCode ?? record.zip_code,
    allergies: record.allergies ?? null,
    medications: record.medications ?? null,
    emergency_contact_name: record.emergencyContact ?? record.emergency_contact_name,
    emergency_contact_phone: record.emergencyPhone ?? record.emergency_contact_phone,
  }

  const inserted = await tryInsert('patients', payload)
  if (!inserted || !inserted.id) {
    // Return a UI-shaped object even if Supabase insert fails.
    return {
      ...(record as any),
      id: (record as any).id || `local-${Date.now()}`,
      name: record.name || `${record.firstName ?? ''} ${record.lastName ?? ''}`.trim() || 'Patient',
      source: 'local',
      age: record.age ?? null,
    }
  }

  const dob = inserted.date_of_birth ? new Date(String(inserted.date_of_birth)) : null
  const computedAge =
    dob && !Number.isNaN(dob.getTime())
      ? Math.max(
          0,
          new Date().getFullYear() - dob.getFullYear() - (new Date().getMonth() < dob.getMonth() ? 1 : 0),
        )
      : null

  return {
    id: inserted.id,
    name: inserted.full_name,
    patientCode: inserted.patient_code,
    qrToken: inserted.qr_token,
    firstName: inserted.first_name,
    lastName: inserted.last_name,
    dateOfBirth: inserted.date_of_birth,
    gender: inserted.gender,
    bloodType: inserted.blood_type,
    phone: inserted.phone,
    email: inserted.email,
    address: inserted.address,
    city: inserted.city,
    zipCode: inserted.zip_code,
    allergies: inserted.allergies,
    medications: inserted.medications,
    emergencyContact: inserted.emergency_contact_name,
    emergencyPhone: inserted.emergency_contact_phone,
    age: computedAge,
    medicalRecords: (record as any).medicalRecords ?? [],
    source: 'supabase',
  }
}

export async function listPatientRecords() {
  const remote = await tryList('patients')
  if (remote && remote.length > 0) {
    return remote.map((item) => ({
      id: item.id,
      patientCode: item.patient_code,
      qrToken: item.qr_token,
      name: item.full_name || item.name || 'Unknown Patient',
      firstName: item.first_name,
      lastName: item.last_name,
      dateOfBirth: item.date_of_birth,
      gender: item.gender,
      bloodType: item.blood_type || item.bloodType || 'Not specified',
      phone: item.phone || 'N/A',
      email: item.email || '',
      address: item.address || '',
      city: item.city || '',
      zipCode: item.zip_code || item.zipCode || '',
      allergies: item.allergies,
      medications: item.medications,
      emergencyContact: item.emergency_contact_name,
      emergencyPhone: item.emergency_contact_phone,
      registeredAt: item.created_at || new Date().toISOString(),
      // Age is not stored in your schema; the UI can treat null as "N/A".
      age: null,
      source: 'supabase',
      raw: item,
    }))
  }

  return readLocal<RecordLike>(LOCAL_PATIENTS_KEY).map((item) => ({ ...(item as RecordLike), source: 'local' }))
}

export async function saveQueueEntry(entry: RecordLike) {
  const local = readLocal<RecordLike>(LOCAL_QUEUE_KEY)
  writeLocal(LOCAL_QUEUE_KEY, [{ ...entry, source: 'local' }, ...local].slice(0, 200))

  // Best-effort facility id resolution from name/phone (your UI uses mock facilities).
  const facilityId = await (async () => {
    if (entry.facilityId) return String(entry.facilityId)
    const facilityName = (entry.facilityName ? String(entry.facilityName) : '').trim()
    const facilityPhone = (entry.facilityPhone ? String(entry.facilityPhone) : '').trim()

    const headers = getHeaders()

    if (facilityName) {
      const res = await fetch(
        `${getRestApiBase()}/facilities?select=id&name=ilike.${encodeURIComponent(`%${facilityName}%`)}`,
        { headers },
      )
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data[0]?.id) return String(data[0].id)
      }
    }
    if (facilityPhone) {
      const res = await fetch(
        `${getRestApiBase()}/facilities?select=id&phone=ilike.${encodeURIComponent(`%${facilityPhone}%`)}`,
        { headers },
      )
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data[0]?.id) return String(data[0].id)
      }
    }

    return null
  })()

  if (!facilityId) {
    throw new Error(`Could not resolve facility_id for facility "${String(entry.facilityName ?? 'Unknown')}". Seed matching records in Supabase facilities.`)
  }

  const estimatedWaitToMinutes = (estimatedWait?: unknown): number | null => {
    const v = typeof estimatedWait === 'string' ? estimatedWait.toLowerCase().trim() : ''
    if (!v) return null

    const rangeMatch = v.match(/(\d+)\s*-\s*(\d+)/)
    const rangeUnitIsHour = v.includes('hour')
    const rangeUnitIsMinute = v.includes('min') || v.includes('minute')

    if (rangeMatch) {
      const end = Number(rangeMatch[2])
      if (!Number.isFinite(end)) return null
      if (rangeUnitIsHour) return Math.round(end * 60)
      if (rangeUnitIsMinute) return Math.round(end)
      return Math.round(end)
    }

    const singleMatch = v.match(/(\d+)/)
    if (!singleMatch) return null
    const num = Number(singleMatch[1])
    if (!Number.isFinite(num)) return null
    if (v.includes('hour')) return Math.round(num * 60)
    return Math.round(num)
  }

  const rpcNextQueueNumber = async (pFacilityId: string) => {
    const res = await fetch(`${getRestApiBase()}/rpc/next_queue_number`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ p_facility_id: pFacilityId }),
    })
    if (!res.ok) return null
    const data = await res.json()
    // Supabase RPC may return { data } or just a scalar depending on configuration.
    if (typeof data === 'number' && Number.isFinite(data)) return data
    if (Array.isArray(data) && typeof data[0] === 'number' && Number.isFinite(data[0])) return data[0]
    if (Array.isArray(data) && data[0] && typeof data[0] === 'object') {
      const values = Object.values(data[0] as RecordLike)
      const firstNumeric = values.find((v) => typeof v === 'number' && Number.isFinite(v))
      if (typeof firstNumeric === 'number') return firstNumeric
    }
    if (data && typeof data === 'object') {
      const values = Object.values(data as RecordLike)
      const firstNumeric = values.find((v) => typeof v === 'number' && Number.isFinite(v))
      if (typeof firstNumeric === 'number') return firstNumeric
      const maybeNested = (data as any).data
      if (typeof maybeNested === 'number' && Number.isFinite(maybeNested)) return maybeNested
      if (Array.isArray(maybeNested) && typeof maybeNested[0] === 'number' && Number.isFinite(maybeNested[0])) return maybeNested[0]
    }
    return null
  }

  const duration = (entry.duration ? String(entry.duration) : null) || null
  const selectedSymptoms = Array.isArray(entry.selectedSymptoms)
    ? (entry.selectedSymptoms as string[])
    : entry.selectedSymptoms
      ? [String(entry.selectedSymptoms)]
      : []

  const triagePayload = {
    patient_id: entry.patientId,
    created_by_user_id: entry.createdByUserId ?? null,
    symptoms_text: entry.symptomsText ?? entry.symptoms ?? 'No symptoms provided',
    selected_symptoms: selectedSymptoms,
    duration,
    severity: entry.severity ?? null,
    priority: entry.priority,
    priority_label: entry.priorityLabel,
    estimated_wait: entry.estimatedWait ?? null,
    recommendation: entry.recommendation ?? 'See a clinician for guidance.',
    ai_analysis: entry.aiAnalysis ?? entry.analysis ?? entry.ai_analysis ?? 'Rule-based triage result.',
    status: 'open',
  }

  const triage = await tryInsert('symptom_triage_assessments', triagePayload)
  if (!triage || !triage.id) {
    throw new Error('Failed to save symptom triage assessment to Supabase.')
  }

  const nextQueueNumber = await rpcNextQueueNumber(facilityId)
  if (!nextQueueNumber) {
    throw new Error('Failed to compute next queue number.')
  }

  const statusLower = String(entry.status ?? 'waiting').toLowerCase()
  const normalizedStatus = ['waiting', 'in_progress', 'called', 'completed', 'cancelled'].includes(statusLower)
    ? statusLower
    : statusLower.includes('progress')
      ? 'in_progress'
      : statusLower.includes('call')
        ? 'called'
        : statusLower.includes('complete')
          ? 'completed'
          : 'waiting'

  const queuePayload = {
    facility_id: facilityId,
    patient_id: entry.patientId,
    triage_assessment_id: triage.id,
    priority: entry.priority,
    priority_label: entry.priorityLabel,
    queue_number: nextQueueNumber,
    status: normalizedStatus,
    estimated_wait_minutes: estimatedWaitToMinutes(entry.estimatedWait),
    notes: entry.notes ?? null,
  }

  await tryInsert('queue_entries', queuePayload)
}

export async function listQueueEntries() {
  const remote = await tryList('provider_queue_dashboard')
  const todayStr = new Date().toISOString().slice(0, 10)

  const mapped =
    remote && remote.length > 0
      ? remote
          .filter((x) => String(x.queue_date) === todayStr)
          .map((item) => {
            const checkIn = item.check_in_at ? new Date(String(item.check_in_at)) : null
            const checkinTime = checkIn && !Number.isNaN(checkIn.getTime())
              ? checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : 'N/A'

            const estimatedWait =
              typeof item.estimated_wait_minutes === 'number'
                ? `${item.estimated_wait_minutes} min`
                : item.estimated_wait_minutes
                  ? `${item.estimated_wait_minutes} min`
                  : 'N/A'

            const statusLower = String(item.status ?? '').toLowerCase()
            const statusLabel =
              statusLower === 'in_progress' ? 'In Progress' : statusLower === 'waiting' ? 'Waiting' : statusLower ? item.status : 'Waiting'

            return {
              id: item.id,
              queueNumber: Number(item.queue_number) || 0,
              name: item.patient_name,
              age: null,
              priority: String(item.priority ?? 'P3'),
              priorityLabel: String(item.priority_label ?? 'Non-Urgent'),
              status: statusLabel,
              checkinTime,
              estimatedWait,
              symptoms: String(item.symptoms_text ?? 'No symptoms provided'),
              bloodType: String(item.blood_type ?? 'Not specified'),
              source: 'supabase',
              raw: item,
            }
          })
      : []

  if (mapped.length > 0) {
    const priorityOrder: Record<string, number> = { P1: 0, P2: 1, P3: 2 }
    return mapped.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9) || a.queueNumber - b.queueNumber)
  }

  // Fallback to local storage (demo mode).
  return readLocal<RecordLike>(LOCAL_QUEUE_KEY).map((item, index) => ({
    ...(item as RecordLike),
    id: (item.id as string) || `queue-local-${index + 1}`,
    queueNumber: (item.queueNumber as number) || 40 + (index + 1),
    source: 'local',
  }))
}
