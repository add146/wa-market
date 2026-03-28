/**
 * Xendit Invoice API helper
 * Uses Xendit REST API directly via fetch() — no SDK needed.
 */

const XENDIT_BASE_URL = 'https://api.xendit.co';

interface XenditInvoiceParams {
    externalId: string;
    amount: number;
    description: string;
    payerEmail?: string;
    successRedirectUrl?: string;
    failureRedirectUrl?: string;
    currency?: string;
    invoiceDuration?: number; // seconds
}

interface XenditInvoiceResponse {
    id: string;
    external_id: string;
    user_id: string;
    status: string;
    merchant_name: string;
    merchant_profile_picture_url: string;
    amount: number;
    payer_email: string;
    description: string;
    invoice_url: string;
    expiry_date: string;
    currency: string;
}

function xenditAuthHeader(secretKey: string): string {
    return 'Basic ' + btoa(secretKey + ':');
}

export async function createXenditInvoice(
    secretKey: string,
    params: XenditInvoiceParams
): Promise<{ success: boolean; data?: XenditInvoiceResponse; error?: string }> {
    try {
        const body: any = {
            external_id: params.externalId,
            amount: params.amount,
            description: params.description,
            currency: params.currency || 'IDR',
            invoice_duration: params.invoiceDuration || 86400, // 24 hours default
        };

        if (params.payerEmail) body.payer_email = params.payerEmail;
        if (params.successRedirectUrl) body.success_redirect_url = params.successRedirectUrl;
        if (params.failureRedirectUrl) body.failure_redirect_url = params.failureRedirectUrl;

        const response = await fetch(`${XENDIT_BASE_URL}/v2/invoices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': xenditAuthHeader(secretKey),
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errData = await response.text();
            console.error('Xendit create invoice error:', errData);
            return { success: false, error: `Xendit API error: ${response.status}` };
        }

        const data = await response.json() as XenditInvoiceResponse;
        return { success: true, data };
    } catch (e: any) {
        console.error('Xendit fetch error:', e);
        return { success: false, error: e.message };
    }
}

/**
 * Verify Xendit webhook callback token.
 * Xendit sends x-callback-token header that must match your webhook verification token
 * (set in Xendit Dashboard → Settings → Callbacks).
 */
export function verifyXenditWebhook(callbackToken: string, expectedToken: string): boolean {
    return callbackToken === expectedToken;
}
