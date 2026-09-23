import { NextResponse } from 'next/server'
import { getOrderCounts } from '@/lib/getOrderCounts'

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ eventDetailsId: string }> },
) {
	const { eventDetailsId } = await params

	try {
		const counts = await getOrderCounts(eventDetailsId)
		return NextResponse.json(counts, { headers: { 'Cache-Control': 'no-store' } })
	} catch (error) {
		console.error('Failed to fetch order counts:', error)
		return NextResponse.json(
			{ error: 'Unable to fetch stock' },
			{ status: 500, headers: { 'Cache-Control': 'no-store' } },
		)
	}
}
