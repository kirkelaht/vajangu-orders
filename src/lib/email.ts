import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

const mailerSend = new MailerSend({
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
    }>;
  }
) {
  try {
    const sender = new Sender("noreply@perefarm.ee", "Vajangu Perefarm");
    const recipients = [new Recipient(customerEmail, customerName)];

    const emailParams = new EmailParams()
      .setFrom(sender)
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
            .content { padding: 20px 0; }
            .order-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .product-item { padding: 8px 0; border-bottom: 1px solid #eee; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🐷 Vajangu Perefarm</h1>
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
                  </div>
                `).join('')}
              </div>
              
              <p>Kui teil on küsimusi, võtke meiega ühendust telefonil või e-posti teel.</p>
              
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
${orderDetails.products.map(product => `- ${product.name} (${product.sku}): ${product.quantity} ${product.uom.toLowerCase()}`).join('\n')}

Kui teil on küsimusi, võtke meiega ühendust.

Parimate soovidega,
Vajangu Perefarm meeskond
      `);

    const response = await mailerSend.email.send(emailParams);
    console.log('Email sent successfully:', response);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
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
    const sender = new Sender("noreply@perefarm.ee", "Vajangu Perefarm");
    const recipients = [new Recipient(customerEmail, customerName)];

    const emailParams = new EmailParams()
      .setFrom(sender)
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
              <h1>🐷 Vajangu Perefarm</h1>
              <h2>Arve ${invoiceNumber}</h2>
            </div>
            
            <div class="invoice-header">
              <div>
                <h3>Müüja:</h3>
                <p>Vajangu Perefarm<br>
                E-posti: info@perefarm.ee<br>
                Telefon: +372 XXX XXXX</p>
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
                <span>Käibemaks (20%):</span>
                <span>${invoiceDetails.vatAmount.toFixed(2)}€</span>
              </div>
              <div class="total-line total-final">
                <span>Kokku (käibemaksuga):</span>
                <span>${invoiceDetails.total.toFixed(2)}€</span>
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

Müüja: Vajangu Perefarm
E-posti: info@perefarm.ee

Ostja: ${invoiceDetails.customer.name}
${invoiceDetails.customer.email}
${invoiceDetails.customer.phone}

Arve kuupäev: ${invoiceDetails.invoiceDate.toLocaleDateString('et-EE')}
Tellimuse kuupäev: ${invoiceDetails.orderDate.toLocaleDateString('et-EE')}
Tellimuse ID: ${invoiceDetails.orderId}

Tooted:
${invoiceDetails.products.map(product => `- ${product.name} (${product.sku}): ${product.quantity} ${product.uom} × ${product.unitPrice.toFixed(2)}€ = ${product.lineTotal.toFixed(2)}€`).join('\n')}

Kokku (ilma käibemaksuta): ${invoiceDetails.subtotal.toFixed(2)}€
Käibemaks (20%): ${invoiceDetails.vatAmount.toFixed(2)}€
Kokku (käibemaksuga): ${invoiceDetails.total.toFixed(2)}€

Vajangu Perefarm | Kõrgekvaliteediline kodumaine sealiha
      `);

    const response = await mailerSend.email.send(emailParams);
    console.log('Invoice email sent successfully:', response);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    return { success: false, error: error.message };
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
    const sender = new Sender("noreply@perefarm.ee", "Vajangu Perefarm");
    const recipients = [new Recipient(customerEmail, customerName)];

    const emailParams = new EmailParams()
      .setFrom(sender)
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
            .content { padding: 20px 0; }
            .order-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .message { white-space: pre-wrap; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🐷 Vajangu Perefarm</h1>
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
              
              <p>Kui teil on küsimusi, võtke meiega ühendust.</p>
              
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
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('Failed to send custom email:', error);
    return { success: false, error: error.message };
  }
}
