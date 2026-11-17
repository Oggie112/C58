const BREVO_API_BASE = 'https://api.brevo.com'

export interface EmailAttachment {
	name: string
	content: Buffer
}

export interface TransactionalEmail {
	to: string
	subject: string
	html: string
	text: string
	attachments?: EmailAttachment[]
	// Must be a UUID. Brevo rejects a repeat of the same key for 30 minutes,
	// so a retried send can't be delivered twice.
	idempotencyKey: string
	tags?: string[]
}

export type SendResult = 'sent' | 'duplicate'

interface BrevoErrorBody {
	code?: string
	message?: string
}

// Sends via Brevo's transactional API (POST /v3/smtp/email). Throws on any
// failure; returns 'duplicate' when Brevo has already accepted a send with
// this idempotency key — the email went out, so callers must treat it as
// sent rather than retry.
export async function sendTransactionalEmail(email: TransactionalEmail): Promise<SendResult> {
	const apiKey = process.env.BREVO_API_KEY
	if (!apiKey) throw new Error('BREVO_API_KEY is not set')
	const senderEmail = process.env.BREVO_SENDER_EMAIL
	if (!senderEmail) throw new Error('BREVO_SENDER_EMAIL is not set')

	// Optional: without it, replies go to the sender address, which has no
	// mailbox (c58.uk receives no mail) and bounces. Must be set wherever
	// real buyers receive these emails.
	const replyToEmail = process.env.BREVO_REPLY_TO_EMAIL
	if (!replyToEmail) {
		console.warn('BREVO_REPLY_TO_EMAIL is not set — replies to this email will bounce')
	}

	const response = await fetch(`${BREVO_API_BASE}/v3/smtp/email`, {
		method: 'POST',
		headers: {
			'api-key': apiKey,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({
			sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME },
			to: [{ email: email.to }],
			...(replyToEmail && { replyTo: { email: replyToEmail } }),
			subject: email.subject,
			htmlContent: email.html,
			textContent: email.text,
			...(email.attachments?.length && {
				attachment: email.attachments.map((attachment) => ({
					name: attachment.name,
					content: attachment.content.toString('base64'),
				})),
			}),
			headers: { idempotencyKey: email.idempotencyKey },
			...(email.tags?.length && { tags: email.tags }),
		}),
	})

	if (response.ok) return 'sent'

	const errorText = await response.text()
	let errorBody: BrevoErrorBody = {}
	try {
		errorBody = JSON.parse(errorText) as BrevoErrorBody
	} catch {
		// Non-JSON error body — fall through with the raw text
	}
	if (errorBody.code === 'duplicate_parameter') return 'duplicate'

	throw new Error(`Brevo send failed: ${response.status} ${errorText}`)
}

export interface ListContact {
	email: string
	listId: number
	// Uppercase names of attributes that already exist in Brevo — values for
	// unknown attributes are silently dropped by Brevo, not rejected
	attributes: Record<string, string>
}

// Adds a contact to a list (POST /v3/contacts), creating or updating them —
// updateEnabled makes a returning buyer an update rather than a 4xx. Never
// sends emailBlacklisted, so it can't undo someone's unsubscribe. Throws on
// failure.
export async function addContactToList(contact: ListContact): Promise<void> {
	const apiKey = process.env.BREVO_API_KEY
	if (!apiKey) throw new Error('BREVO_API_KEY is not set')

	const response = await fetch(`${BREVO_API_BASE}/v3/contacts`, {
		method: 'POST',
		headers: {
			'api-key': apiKey,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({
			email: contact.email,
			listIds: [contact.listId],
			updateEnabled: true,
			attributes: contact.attributes,
		}),
	})

	// 201 when created; an update succeeds without one
	if (!response.ok) {
		throw new Error(`Brevo contact update failed: ${response.status} ${await response.text()}`)
	}
}
