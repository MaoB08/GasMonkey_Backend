import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

/**
 * Genera el PDF de la factura electrónica conforme a DIAN
 */
export async function generateInvoicePDF(invoiceData) {
  try {
    const { company, customer, invoice, items, cufe, resolution } = invoiceData;

    // Crear nuevo documento PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // Tamaño carta (Letter)
    const { width, height } = page.getSize();

    // Fuentes
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let yPosition = height - 50;

    // ========== ENCABEZADO DE LA EMPRESA ==========
    page.drawText(company.business_name.toUpperCase(), {
      x: 50,
      y: yPosition,
      size: 14,
      font: fontBold,
      color: rgb(0, 0, 0.5)
    });

    yPosition -= 18;
    page.drawText(`NIT: ${company.nit}-${company.dv}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold
    });

    yPosition -= 14;
    page.drawText(`${company.address}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontRegular
    });

    yPosition -= 13;
    page.drawText(`${company.city}, ${company.department} - ${company.country || 'Colombia'}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontRegular
    });

    yPosition -= 13;
    page.drawText(`Tel: ${company.phone || 'N/A'} | Email: ${company.email || 'N/A'}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontRegular
    });

    // Régimen tributario
    if (company.tax_regime) {
      yPosition -= 13;
      page.drawText(`Régimen: ${company.tax_regime}`, {
        x: 50,
        y: yPosition,
        size: 8,
        font: fontRegular
      });
    }

    // ========== TÍTULO FACTURA ELECTRÓNICA ==========
    yPosition -= 35;

    // Fondo para el título
    page.drawRectangle({
      x: 45,
      y: yPosition - 5,
      width: 505,
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0, 0, 0.5),
      borderWidth: 1
    });

    page.drawText('FACTURA ELECTRÓNICA DE VENTA', {
      x: 50,
      y: yPosition + 5,
      size: 13,
      font: fontBold,
      color: rgb(0, 0, 0)
    });

    // Número de factura
    page.drawText(`No. ${invoice.full_number}`, {
      x: 400,
      y: yPosition + 5,
      size: 13,
      font: fontBold,
      color: rgb(0.8, 0, 0)
    });

    // ========== INFORMACIÓN DE LA FACTURA ==========
    yPosition -= 30;

    page.drawText(`Fecha de emisión: ${invoice.issue_date} ${invoice.issue_time || ''}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontRegular
    });

    yPosition -= 14;
    const paymentType = invoice.payment_method || 'Contado';
    page.drawText(`Forma de pago: ${paymentType}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontRegular
    });

    if (invoice.due_date && paymentType.toLowerCase().includes('crédito')) {
      page.drawText(`Vencimiento: ${invoice.due_date}`, {
        x: 250,
        y: yPosition,
        size: 9,
        font: fontRegular
      });
    }

    yPosition -= 14;
    page.drawText(`Medio de pago: ${invoice.payment_means || 'N/A'}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontRegular
    });

    // ========== INFORMACIÓN DEL CLIENTE ==========
    yPosition -= 30;

    // Fondo para sección cliente
    page.drawRectangle({
      x: 45,
      y: yPosition - 65,
      width: 505,
      height: 75,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1
    });

    page.drawText('INFORMACIÓN DEL CLIENTE', {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold
    });

    yPosition -= 18;
    const customerName = customer.business_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    page.drawText(`Nombre/Razón Social: ${customerName}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontRegular
    });

    yPosition -= 14;
    const customerDoc = customer.customer_type === 'NIT' && customer.dv
      ? `${customer.document_number}-${customer.dv}`
      : customer.document_number;
    page.drawText(`${customer.customer_type}: ${customerDoc}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontRegular
    });

    yPosition -= 14;
    page.drawText(`Dirección: ${customer.address || 'N/A'}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontRegular
    });

    yPosition -= 14;
    page.drawText(`Ciudad: ${customer.city || 'N/A'}, ${customer.department || 'N/A'}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontRegular
    });

    yPosition -= 14;
    page.drawText(`Email: ${customer.email || 'N/A'} | Tel: ${customer.phone || 'N/A'}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontRegular
    });

    // ========== TABLA DE ITEMS ==========
    yPosition -= 35;

    // Encabezado de tabla
    page.drawRectangle({
      x: 45,
      y: yPosition - 18,
      width: 505,
      height: 20,
      color: rgb(0.2, 0.2, 0.5),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    page.drawText('#', { x: 50, y: yPosition - 5, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('CÓDIGO', { x: 70, y: yPosition - 5, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('DESCRIPCIÓN', { x: 140, y: yPosition - 5, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('CANT', { x: 310, y: yPosition - 5, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('UND', { x: 350, y: yPosition - 5, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('P.UNIT', { x: 385, y: yPosition - 5, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('IVA%', { x: 440, y: yPosition - 5, size: 8, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('TOTAL', { x: 495, y: yPosition - 5, size: 8, font: fontBold, color: rgb(1, 1, 1) });

    yPosition -= 30; // Aumentado de 25 a 30 para evitar sobreposición

    // Items
    for (const item of items) {
      // Dibujar borde de fila
      page.drawRectangle({
        x: 45,
        y: yPosition - 3,
        width: 505,
        height: 18,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 0.5
      });

      page.drawText(item.line_number.toString(), {
        x: 50,
        y: yPosition + 5,
        size: 8,
        font: fontRegular
      });

      // Código del producto
      const itemCode = item.code || 'N/A';
      page.drawText(itemCode.substring(0, 10), {
        x: 70,
        y: yPosition + 5,
        size: 7,
        font: fontRegular
      });

      // Descripción (recortar si es muy larga)
      const description = item.name.length > 25
        ? item.name.substring(0, 22) + '...'
        : item.name;

      page.drawText(description, {
        x: 140,
        y: yPosition + 5,
        size: 8,
        font: fontRegular
      });

      // Cantidad
      page.drawText(Number(item.quantity).toFixed(2), {
        x: 310,
        y: yPosition + 5,
        size: 8,
        font: fontRegular
      });

      // Unidad de medida
      page.drawText(item.unit_measure || 'UNI', {
        x: 350,
        y: yPosition + 5,
        size: 7,
        font: fontRegular
      });

      // Precio unitario
      page.drawText(`$${formatCurrency(item.unit_price)}`, {
        x: 385,
        y: yPosition + 5,
        size: 8,
        font: fontRegular
      });

      // Porcentaje IVA
      page.drawText(`${Number(item.iva_percentage || 0).toFixed(0)}%`, {
        x: 440,
        y: yPosition + 5,
        size: 8,
        font: fontRegular
      });

      // Total del item
      page.drawText(`$${formatCurrency(item.total)}`, {
        x: 485,
        y: yPosition + 5,
        size: 8,
        font: fontRegular
      });

      yPosition -= 18;
    }

    // ========== TOTALES ==========
    yPosition -= 15;

    // Cuadro de totales
    page.drawRectangle({
      x: 350,
      y: yPosition - 55,
      width: 200,
      height: 60,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    yPosition -= 5;
    page.drawText('Subtotal:', {
      x: 360,
      y: yPosition,
      size: 10,
      font: fontRegular
    });
    page.drawText(`$${formatCurrency(invoice.subtotal)}`, {
      x: 470,
      y: yPosition,
      size: 10,
      font: fontRegular
    });

    yPosition -= 18;
    page.drawText('IVA:', {
      x: 360,
      y: yPosition,
      size: 10,
      font: fontRegular
    });
    page.drawText(`$${formatCurrency(invoice.tax_total)}`, {
      x: 470,
      y: yPosition,
      size: 10,
      font: fontRegular
    });

    yPosition -= 20;
    page.drawText('TOTAL:', {
      x: 360,
      y: yPosition,
      size: 12,
      font: fontBold
    });
    page.drawText(`$${formatCurrency(invoice.total)}`, {
      x: 460,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: rgb(0, 0.5, 0)
    });

    // ========== NOTAS/OBSERVACIONES ==========
    if (invoice.notes) {
      yPosition -= 30;
      page.drawText('Observaciones:', {
        x: 50,
        y: yPosition,
        size: 9,
        font: fontBold
      });
      yPosition -= 14;
      const notes = invoice.notes.substring(0, 100);
      page.drawText(notes, {
        x: 50,
        y: yPosition,
        size: 8,
        font: fontRegular
      });
    }

    // ========== CÓDIGO QR ==========
    const qrCodeBuffer = await generateQRCode(cufe);
    const qrImage = await pdfDoc.embedPng(qrCodeBuffer);

    page.drawImage(qrImage, {
      x: 50,
      y: 80,
      width: 90,
      height: 90
    });

    // ========== CUFE ==========
    page.drawText('CUFE:', {
      x: 150,
      y: 160,
      size: 8,
      font: fontBold
    });

    // Dividir CUFE en líneas de 55 caracteres
    const cufeLines = cufe.match(/.{1,55}/g) || [cufe];
    let cufeY = 148;
    for (const line of cufeLines) {
      page.drawText(line, {
        x: 150,
        y: cufeY,
        size: 6,
        font: fontRegular
      });
      cufeY -= 8;
    }

    // ========== INFORMACIÓN LEGAL Y RESOLUCIÓN DIAN ==========
    page.drawText('Esta factura electrónica ha sido validada por la DIAN', {
      x: 150,
      y: 110,
      size: 7,
      font: fontRegular
    });

    if (resolution) {
      page.drawText(`Resolución DIAN No. ${resolution.resolution_number} del ${resolution.resolution_date}`, {
        x: 150,
        y: 100,
        size: 7,
        font: fontRegular
      });

      page.drawText(`Rango autorizado: ${resolution.prefix}${String(resolution.from_number).padStart(6, '0')} al ${resolution.prefix}${String(resolution.to_number).padStart(6, '0')}`, {
        x: 150,
        y: 90,
        size: 7,
        font: fontRegular
      });

      page.drawText(`Vigencia: ${resolution.valid_from} al ${resolution.valid_to}`, {
        x: 150,
        y: 80,
        size: 7,
        font: fontRegular
      });
    }

    // Pie de página
    page.drawText('Documento generado electrónicamente - Sin firma autógrafa', {
      x: 50,
      y: 50,
      size: 7,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5)
    });

    // Guardar PDF
    const pdfBytes = await pdfDoc.save();
    const pdfPath = path.join('storage', 'invoices', `${invoice.full_number}.pdf`);

    // Crear directorio si no existe
    fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    fs.writeFileSync(pdfPath, pdfBytes);

    console.log('✅ PDF generado:', pdfPath);

    return {
      success: true,
      path: pdfPath,
      buffer: pdfBytes
    };

  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    throw error;
  }
}

/**
 * Generar código QR con información de la factura
 */
async function generateQRCode(cufe) {
  // La DIAN requiere este formato específico en el QR
  const qrData = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`;

  const qrCodeDataURL = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 200,
    margin: 1
  });

  // Convertir de data URL a buffer
  const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * Formatear moneda
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}