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

	it("sends the address and shows the server's reply", async () => {
		jest.mocked(resendTickets).mockResolvedValue({ status: 'requested', message: 'If we have paid orders…' })
		render(<ResendForm />)

		enterEmail('buyer@example.com')
		fireEvent.click(screen.getByRole('button', { name: /Resend my tickets/ }))

		expect(await screen.findByRole('status')).toHaveTextContent('If we have paid orders…')
		expect(jest.mocked(resendTickets).mock.calls[0][1]).toEqual({ email: 'buyer@example.com', turnstileToken: undefined })
	})

	it('shows the security check when the server asks for one', async () => {
		jest.mocked(resendTickets).mockResolvedValue({ status: 'challenge_required' })
		render(<ResendForm />)

		enterEmail('buyer@example.com')
		fireEvent.click(screen.getByRole('button', { name: /Resend my tickets/ }))

		expect(await screen.findByTestId('turnstile-challenge')).toBeInTheDocument()
	})
})
