import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'

export async function POST() {
    const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
    if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/dashboard/reload-schema`, {}, { headers: { cookie: cookieHeader } })
        return NextResponse.json({ ok: true })
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
