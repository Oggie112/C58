// The consent a buyer gives by ticking the marketing checkbox at checkout.
// One constant, shown in TierPicker and recorded on their Brevo contact
// (OPT_IN_WORDING), so the stored evidence of what they agreed to can never
// drift from what they actually saw. Changing it changes what future buyers
// consent to — earlier contacts keep the wording they agreed to.
export const MARKETING_OPT_IN_WORDING = 'Keep me posted about future C58 events and news.'

// Where the consent was captured (OPT_IN_SOURCE), in case more sign-up
// routes are added later.
export const MARKETING_OPT_IN_SOURCE = 'ticket purchase'
