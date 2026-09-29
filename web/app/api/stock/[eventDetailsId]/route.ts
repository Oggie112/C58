import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sweepStaleReservations } from '@/lib/sweepStaleReservations'
import { getTierAvailability } from '@/lib/getTierAvailability'

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ eventDetailsId: string }> },
) {
	const { eventDetailsId } = await params

	try {
		// Sweep-then-read in one transaction, not a plain read — otherwise a
		// tier that sold out on paper via abandoned carts could show "sold
		// out" forever with no path back to correct, since nobody could ever
		// trigger a new reservation attempt (the only other place the sweep
		// runs) once the quantity controls disable themselves at 0 remaining.
		const availability = await sql.begin(async (tx) => {
			await sweepStaleReservations(tx, eventDetailsId)
			return getTierAvailability(tx, eventDetailsId)
		})
		return NextResponse.json(availability, { headers: { 'Cache-Control': 'no-store' } })
	} catch (error) {
		console.error('Failed to fetch tier availability:', error)
		return NextResponse.json(
			{ error: 'Unable to fetch stock' },
			{ status: 500, headers: { 'Cache-Control': 'no-store' } },
		)
	}
}
