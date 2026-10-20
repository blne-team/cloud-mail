import { WorkerEntrypoint } from 'cloudflare:workers';
import { email } from './email';

// Messages from the tokenflake.com contact form, handed over by the `site` Worker through a service binding
// (`{ service: "cloud-mail", entrypoint: "ContactInbox" }`). A named entrypoint is reachable only through service
// bindings in this account, never from the internet. Each message is a complete email from the visitor to `to`,
// passed through the same handler as mail that arrives over SMTP, so it's stored, filtered and shown like any
// other email, and a reply goes to the visitor.
export class ContactInbox extends WorkerEntrypoint {

	async receive(raw, to) {
		let rejected = '';
		const message = {
			to,
			raw: new Response(raw).body,
			rawSize: raw.length,
			headers: new Headers(),
			setReject(reason) {
				rejected = reason;
			},
			// A form message has no SMTP session to forward from; a forwarding rule just skips it.
			async forward() {
				throw new Error('Contact form messages cannot be forwarded');
			},
		};
		await email(message, this.env, this.ctx);
		if (rejected) {
			throw new Error(`Contact form message rejected: ${rejected}`);
		}
	}
}
