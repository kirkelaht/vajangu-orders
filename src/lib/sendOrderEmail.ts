import { EmailParams, Sender, Recipient } from "mailersend";
import { mailerSend } from "@/lib/email";

export async function sendOrderEmail(toEmail: string, orderNumber: string) {
  try {
    const sentFrom = new Sender("no-reply@perefarm.ee", "Vajangu Perefarm");
    const recipients = [new Recipient(toEmail)];

    const replyTo = new Sender("vajanguperefarm@gmail.com", "Vajangu Perefarm");
    
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(replyTo)
      .setSubject(`Tellimus #${orderNumber} kinnitatud`)
      .setText(`Tere! Teie tellimus nr ${orderNumber} on vastu võetud.`)
      .setHtml(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>Tellimus #${orderNumber} kinnitatud</h1>
            <p>Tere!</p>
            <p>Teie tellimus nr ${orderNumber} on vastu võetud.</p>
          </div>
        </body>
        </html>
      `);

    await mailerSend.email.send(emailParams);
    console.log("📨 Tellimusemail saadetud!");
    return { success: true };
  } catch (err) {
    console.error("❌ sendOrderEmail failed:", err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

