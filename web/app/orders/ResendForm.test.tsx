import { fireEvent, render, screen } from '@testing-library/react'
import ResendForm from './ResendForm'
import { resendTickets } from './actions'

jest.mock('./actions', () => ({
	resendTickets: jest.fn(),
}))
// The challenge itself is covered by TurnstileChallenge.test.tsx
jest.mock('@/app/components/TurnstileChallenge', () => ({
	__esModule: true,
	default: ({ active }: { active: boolean }) => (active ? <div data-testid="turnstile-challenge" /> : null),
}))

function enterEmail(value: string) {
	fireEvent.change(screen.getByLabelText('Email used to buy'), { target: { value } })
}

describe('ResendForm', () => {
	beforeEach(() => {
		jest.mocked(resendTickets).mockReset()
	})

	it('keeps the button disabled until the address looks valid', () => {
		render(<ResendForm />)
		const button = screen.getByRole('button', { name: /Resend my tickets/ })

		expect(button).toBeDisabled()
		enterEmail('not-an-email')
		expect(button).toBeDisabled()
		enterEmail('buyer@example.com')
		expect(button).not.toBeDisabled()
	})

	it('replaces the form with a confirmation showing the address back — "received", never "sent"', async () => {
		jest.mocked(resendTickets).mockResolvedValue({ status: 'requested', message: 'If we have paid orders…' })
		render(<ResendForm />)

		enterEmail('buyer@example.com')
		fireEvent.click(screen.getByRole('button', { name: /Resend my tickets/ }))

		const confirmation = await screen.findByRole('status')
		expect(confirmation).toHaveTextContent('Request received')
		expect(confirmation).toHaveTextContent('buyer@example.com')
		expect(confirmation).toHaveTextContent('If we have paid orders…')
		expect(confirmation).not.toHaveTextContent(/sent/i)
		expect(screen.queryByLabelText('Email used to buy')).not.toBeInTheDocument()
		expect(jest.mocked(resendTickets).mock.calls[0][1]).toEqual({ email: 'buyer@example.com', turnstileToken: undefined })
	})

	it('brings back an empty, focused form for a different address', async () => {
		jest.mocked(resendTickets).mockResolvedValue({ status: 'requested', message: 'If we have paid orders…' })
		render(<ResendForm />)
		enterEmail('buyer@example.com')
		fireEvent.click(screen.getByRole('button', { name: /Resend my tickets/ }))

		fireEvent.click(await screen.findByRole('button', { name: /Use a different address/ }))

		const input = screen.getByLabelText('Email used to buy')
		expect(input).toHaveValue('')
		expect(input).toHaveFocus()
		expect(screen.queryByText('Request received')).not.toBeInTheDocument()
	})

	it('shows an invalid-address reply beside the form, keeping what was typed', async () => {
		jest.mocked(resendTickets).mockResolvedValue({ status: 'invalid', message: 'Enter a valid email address' })
		render(<ResendForm />)

		// Passes the browser-side pattern, so it reaches the server's stricter check
		enterEmail('buyer@example.c')
		fireEvent.click(screen.getByRole('button', { name: /Resend my tickets/ }))

		expect(await screen.findByRole('status')).toHaveTextContent('Enter a valid email address')
		expect(screen.getByLabelText('Email used to buy')).toHaveValue('buyer@example.c')
	})

	it('shows the security check when the server asks for one', async () => {
		jest.mocked(resendTickets).mockResolvedValue({ status: 'challenge_required' })
		render(<ResendForm />)

		enterEmail('buyer@example.com')
		fireEvent.click(screen.getByRole('button', { name: /Resend my tickets/ }))

		expect(await screen.findByTestId('turnstile-challenge')).toBeInTheDocument()
	})
})
