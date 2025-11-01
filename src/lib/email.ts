import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load logo as base64 from public directory
const logoBase64 = (() => {
  try {
    const logoPath = join(process.cwd(), 'public', 'perefarm_logo.png');
    const logoBuffer = readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Failed to load logo:', error);
    // Fallback to URL if file read fails
    return 'https://perefarm.ee/perefarm_logo.png';
  }
})();

export const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || '',
});

export async function sendOrderConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderId: string,
  orderDetails: {
    ring: string;
    stop: string;
    deliveryType: string;
    deliveryAddress?: string;
    paymentMethod: string;
    products: Array<{
      name: string;
      sku: string;
      quantity: number;
      uom: string;
      unitPrice?: number;
    }>;
    total?: number;
  }
) {
  try {
    const sender = new Sender("no-reply@perefarm.ee", "Vajangu Perefarm");
    const replyTo = new Sender("vajanguperefarm@gmail.com", "Vajangu Perefarm");
    const recipients = [new Recipient(customerEmail, customerName)];

    // Calculate total if not provided
    let total = orderDetails.total;
    if (total === undefined && orderDetails.products.length > 0) {
      total = orderDetails.products.reduce((sum, product) => {
        return sum + (product.unitPrice ? product.unitPrice * product.quantity : 0);
      }, 0);
    }
    const totalDisplay = total !== undefined && total > 0 ? total.toFixed(2) : null;

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setReplyTo(replyTo)
      .setTo(recipients)
      .setSubject(`Tellimuse kinnitus - Vajangu Perefarm`)
      .setHtml(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Tellimuse kinnitus</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
            .logo { max-width: 120px; height: auto; margin-bottom: 10px; }
            .content { padding: 20px 0; }
            .order-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .product-item { padding: 8px 0; border-bottom: 1px solid #eee; }
            .product-item:last-child { border-bottom: none; }
            .total { font-size: 1.2em; font-weight: bold; color: #28a745; margin-top: 15px; padding-top: 15px; border-top: 2px solid #28a745; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoBase64}" alt="Vajangu Perefarm Logo" class="logo" />
              <h2>Aitäh, Teie tellimus on vastu võetud!</h2>
            </div>
            
            <div class="content">
              <p>Tere ${customerName},</p>
              
              <p>Teie tellimus on edukalt edastatud ja meie meeskond hakkab sellega tegelema.</p>
              
              
              <div class="order-details">
                <h3>Tellimuse andmed:</h3>
                <p><strong>Tellimuse ID:</strong> ${orderId}</p>
                <p><strong>Ring:</strong> ${orderDetails.ring}</p>
                <p><strong>Peatus:</strong> ${orderDetails.stop}</p>
                <p><strong>Tarne tüüp:</strong> ${orderDetails.deliveryType === 'HOME' ? 'Kodune tarne' : 'Peatusse tarne'}</p>
                ${orderDetails.deliveryAddress ? `<p><strong>Tarneaadress:</strong> ${orderDetails.deliveryAddress}</p>` : ''}
                <p><strong>Maksemeetod:</strong> ${orderDetails.paymentMethod === 'TRANSFER' ? 'Ülekandega' : 'Sularaha'}</p>
              </div>
              
              <div class="order-details">
                <h3>Tellitud tooted:</h3>
                ${orderDetails.products.map(product => `
                  <div class="product-item">
                    <strong>${product.name}</strong> (${product.sku})<br>
                    Kogus: ${product.quantity} ${product.uom.toLowerCase()}
                    ${product.unitPrice ? `<br>Hind: ${product.unitPrice.toFixed(2)}€/${product.uom.toLowerCase()} = ${(product.unitPrice * product.quantity).toFixed(2)}€` : ''}
                  </div>
                `).join('')}
                ${totalDisplay ? `<div class="total">Kokku: ${totalDisplay}€</div>` : ''}
              </div>
              
              <p>Kui teil on küsimusi, võtke meiega ühendust telefonil 5358 6772</p>
              
              <p>Parimate soovidega,<br>
              Vajangu Perefarm meeskond</p>
            </div>
            
            <div class="footer">
              <p>Vajangu Perefarm | Kõrgekvaliteediline kodumaine sealiha</p>
            </div>
          </div>
        </body>
        </html>
      `)
      .setText(`
Aitäh, Teie tellimus on vastu võetud!

Tellimuse andmed:
- Tellimuse ID: ${orderId}
- Ring: ${orderDetails.ring}
- Peatus: ${orderDetails.stop}
- Tarne tüüp: ${orderDetails.deliveryType === 'HOME' ? 'Kodune tarne' : 'Peatusse tarne'}
${orderDetails.deliveryAddress ? `- Tarneaadress: ${orderDetails.deliveryAddress}` : ''}
- Maksemeetod: ${orderDetails.paymentMethod === 'TRANSFER' ? 'Ülekandega' : 'Sularaha'}

Tellitud tooted:
${orderDetails.products.map(product => {
  const lineTotal = product.unitPrice ? product.unitPrice * product.quantity : null;
  return `- ${product.name} (${product.sku}): ${product.quantity} ${product.uom.toLowerCase()}${product.unitPrice ? ` × ${product.unitPrice.toFixed(2)}€ = ${lineTotal!.toFixed(2)}€` : ''}`;
}).join('\n')}
${totalDisplay ? `\nKokku: ${totalDisplay}€` : ''}

Kui teil on küsimusi, võtke meiega ühendust telefonil 5358 6772

Parimate soovidega,
Vajangu Perefarm meeskond
      `);

    // Validate API key before sending
    if (!process.env.MAILERSEND_API_KEY) {
      console.error('MailerSend API key not configured');
      return { success: false, error: 'MailerSend API key not configured' };
    }

    const response = await mailerSend.email.send(emailParams);
    console.log('Order confirmation email sent successfully:', {
      messageId: (response as any)?.body?.message_id || (response as { messageId?: string })?.messageId || 'unknown',
      response: JSON.stringify(response).substring(0, 200)
    });
    return { 
      success: true, 
      messageId: (response as any)?.body?.message_id || (response as { messageId?: string })?.messageId || 'unknown' 
    };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { message: errorMessage, stack: errorDetails });
    return { success: false, error: errorMessage };
  }
}

export async function sendInvoiceEmail(
  customerEmail: string,
  customerName: string,
  invoiceNumber: string,
  invoiceDetails: {
    orderId: string;
    orderDate: Date;
    invoiceDate: Date;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
    ring: string;
    stop: string;
    deliveryType: string;
    deliveryAddress?: string;
    paymentMethod: string;
    products: Array<{
      name: string;
      sku: string;
      quantity: number;
      uom: string;
      unitPrice: number;
      lineTotal: number;
    }>;
    subtotal: number;
    vatAmount: number;
    total: number;
  }
) {
  try {
    const sender = new Sender("no-reply@perefarm.ee", "Vajangu Perefarm");
    const replyTo = new Sender("vajanguperefarm@gmail.com", "Vajangu Perefarm");
    const recipients = [new Recipient(customerEmail, customerName)];

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setReplyTo(replyTo)
      .setTo(recipients)
      .setSubject(`Arve ${invoiceNumber} - Vajangu Perefarm`)
      .setHtml(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Arve ${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
            .logo { max-width: 120px; height: auto; margin-bottom: 10px; }
            .invoice-header { display: flex; justify-content: space-between; margin: 20px 0; }
            .invoice-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .products-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .products-table th, .products-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .products-table th { background: #f8f9fa; font-weight: bold; }
            .total-section { text-align: right; margin-top: 20px; }
            .total-line { display: flex; justify-content: space-between; margin: 5px 0; }
            .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoBase64}" alt="Vajangu Perefarm Logo" class="logo" />
              <h2>Arve ${invoiceNumber}</h2>
            </div>
            
            <div class="invoice-header">
              <div>
                <h3>Müüja:</h3>
                <p>Vajangu Perefarm OÜ<br>
                Registrikood: 16109182<br>
                KMKR: EE102313446<br>
                Aadress: Lõõtspilli 2, Rakvere, Estonia<br>
                Juriidiline aadress: Lääne-Viru maakond, Tapa vald, Vajangu küla, Rammo tee 3, 46002<br>
                E-posti: info@perefarm.ee<br>
                Telefon: 5358 6772</p>
              </div>
              <div>
                <h3>Ostja:</h3>
                <p>${invoiceDetails.customer.name}<br>
                ${invoiceDetails.customer.email}<br>
                ${invoiceDetails.customer.phone}</p>
              </div>
            </div>
            
            <div class="invoice-details">
              <p><strong>Arve kuupäev:</strong> ${invoiceDetails.invoiceDate.toLocaleDateString('et-EE')}</p>
              <p><strong>Tellimuse kuupäev:</strong> ${invoiceDetails.orderDate.toLocaleDateString('et-EE')}</p>
              <p><strong>Tellimuse ID:</strong> ${invoiceDetails.orderId}</p>
              <p><strong>Ring:</strong> ${invoiceDetails.ring}</p>
              <p><strong>Peatus:</strong> ${invoiceDetails.stop}</p>
              <p><strong>Tarne tüüp:</strong> ${invoiceDetails.deliveryType === 'HOME' ? 'Kodune tarne' : 'Peatusse tarne'}</p>
              ${invoiceDetails.deliveryAddress ? `<p><strong>Tarneaadress:</strong> ${invoiceDetails.deliveryAddress}</p>` : ''}
              <p><strong>Maksemeetod:</strong> ${invoiceDetails.paymentMethod === 'TRANSFER' ? 'Ülekandega' : 'Sularaha'}</p>
            </div>
            
            <table class="products-table">
              <thead>
                <tr>
                  <th>Toode</th>
                  <th>Kogus</th>
                  <th>Ühik</th>
                  <th>Hind</th>
                  <th>Summa</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceDetails.products.map(product => `
                  <tr>
                    <td>${product.name} (${product.sku})</td>
                    <td>${product.quantity}</td>
                    <td>${product.uom}</td>
                    <td>${product.unitPrice.toFixed(2)}€</td>
                    <td>${product.lineTotal.toFixed(2)}€</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-line">
                <span>Kokku (ilma käibemaksuta):</span>
                <span>${invoiceDetails.subtotal.toFixed(2)}€</span>
              </div>
              <div class="total-line">
                <span>Käibemaks (24%, sisse arvatud):</span>
                <span>${invoiceDetails.vatAmount.toFixed(2)}€</span>
              </div>
              <div class="total-line total-final">
                <span>Kokku (käibemaksuga):</span>
                <span>${invoiceDetails.total.toFixed(2)}€</span>
              </div>
              <div class="total-line" style="margin-top: 10px; font-size: 0.9em; color: #666;">
                <span>* Kõik hinnad sisaldavad käibemaksu (24%)</span>
              </div>
            </div>
            
            <div class="footer">
              <p>Vajangu Perefarm | Kõrgekvaliteediline kodumaine sealiha</p>
              <p>Arve on genereeritud automaatselt</p>
            </div>
          </div>
        </body>
        </html>
      `)
      .setText(`
Arve ${invoiceNumber} - Vajangu Perefarm

Müüja: Vajangu Perefarm OÜ
Registrikood: 16109182
KMKR: EE102313446
Aadress: Lõõtspilli 2, Rakvere, Estonia
Juriidiline aadress: Lääne-Viru maakond, Tapa vald, Vajangu küla, Rammo tee 3, 46002
E-posti: info@perefarm.ee
Telefon: 5358 6772

Ostja: ${invoiceDetails.customer.name}
${invoiceDetails.customer.email}
${invoiceDetails.customer.phone}

Arve kuupäev: ${invoiceDetails.invoiceDate.toLocaleDateString('et-EE')}
Tellimuse kuupäev: ${invoiceDetails.orderDate.toLocaleDateString('et-EE')}
Tellimuse ID: ${invoiceDetails.orderId}

Tooted:
${invoiceDetails.products.map(product => `- ${product.name} (${product.sku}): ${product.quantity} ${product.uom} × ${product.unitPrice.toFixed(2)}€ = ${product.lineTotal.toFixed(2)}€`).join('\n')}

Kokku (ilma käibemaksuta): ${invoiceDetails.subtotal.toFixed(2)}€
Käibemaks (24%, sisse arvatud): ${invoiceDetails.vatAmount.toFixed(2)}€
Kokku (käibemaksuga): ${invoiceDetails.total.toFixed(2)}€

Vajangu Perefarm | Kõrgekvaliteediline kodumaine sealiha
      `);

    const response = await mailerSend.email.send(emailParams);
    console.log('Invoice email sent successfully:', response);
    return { success: true, messageId: (response as { messageId?: string }).messageId || 'unknown' };
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendCustomEmail(
  customerEmail: string,
  customerName: string,
  subject: string,
  message: string,
  orderDetails: {
    orderId: string;
    customerName: string;
    ring: string;
    stop: string;
  }
) {
  try {
    const sender = new Sender("no-reply@perefarm.ee", "Vajangu Perefarm");
    const replyTo = new Sender("vajanguperefarm@gmail.com", "Vajangu Perefarm");
    const recipients = [new Recipient(customerEmail, customerName)];

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setReplyTo(replyTo)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
            .logo { max-width: 120px; height: auto; margin-bottom: 10px; }
            .content { padding: 20px 0; }
            .order-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .message { white-space: pre-wrap; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoBase64}" alt="Vajangu Perefarm Logo" class="logo" />
              <h2>Vajangu Perefarm</h2>
            </div>
            
            <div class="content">
              <p>Tere ${customerName},</p>
              
              <div class="message">${message}</div>
              
              <div class="order-info">
                <h3>Tellimuse andmed:</h3>
                <p><strong>Tellimuse ID:</strong> ${orderDetails.orderId}</p>
                <p><strong>Ring:</strong> ${orderDetails.ring}</p>
                <p><strong>Peatus:</strong> ${orderDetails.stop}</p>
              </div>
              
              <p>Kui teil on küsimusi, võtke meiega ühendust telefonil 5358 6772</p>
              
              <p>Parimate soovidega,<br>
              Vajangu Perefarm meeskond</p>
            </div>
            
            <div class="footer">
              <p>Vajangu Perefarm | Kõrgekvaliteediline kodumaine sealiha</p>
            </div>
          </div>
        </body>
        </html>
      `)
      .setText(`
${subject}

Tere ${customerName},

${message}

Tellimuse andmed:
- Tellimuse ID: ${orderDetails.orderId}
- Ring: ${orderDetails.ring}
- Peatus: ${orderDetails.stop}

Kui teil on küsimusi, võtke meiega ühendust.

Parimate soovidega,
Vajangu Perefarm meeskond
      `);

    const response = await mailerSend.email.send(emailParams);
    console.log('Custom email sent successfully:', response);
    return { success: true, messageId: (response as { messageId?: string }).messageId || 'unknown' };
  } catch (error) {
    console.error('Failed to send custom email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Funktsioon admin-lehe kirjade saatmiseks
export async function sendAdminEmail(toEmail: string, subject: string, message: string) {
  try {
    // Aadress, millelt kiri läheb välja
    const sender = new Sender("info@perefarm.ee", "Vajangu Perefarm");
    const recipients = [new Recipient(toEmail)];

    const replyTo = new Sender("info@perefarm.ee", "Vajangu Perefarm");
    
    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject(subject)
      .setText(message)
      .setReplyTo(replyTo); // vastused lähevad siia postkasti

    // Validate API key before sending
    if (!process.env.MAILERSEND_API_KEY) {
      console.error('MailerSend API key not configured');
      return { success: false, error: 'MailerSend API key not configured' };
    }

    const response = await mailerSend.email.send(emailParams);
    console.log("✅ Admin email sent successfully");
    return { 
      success: true, 
      messageId: (response as any)?.body?.message_id || (response as { messageId?: string })?.messageId || 'unknown' 
    };
  } catch (err) {
    console.error("❌ sendAdminEmail failed:", err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
