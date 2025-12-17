import crypto from 'crypto';

/**
 * Genera el CUFE (Código Único de Factura Electrónica)
 * según la Resolución 000042 de 2020 de la DIAN
 */
export function generateCUFE({
  invoiceNumber,
  issueDate,
  issueTime,
  subtotal,
  taxTotal,
  total,
  nit,
  customerDocumentType,
  customerDocumentNumber,
  technicalKey,
  testSetId
}) {
  // Formatear valores según especificaciones DIAN
  const formattedSubtotal = parseFloat(subtotal).toFixed(2);
  const formattedTax = parseFloat(taxTotal).toFixed(2);
  const formattedTotal = parseFloat(total).toFixed(2);
  
  // Construir cadena para CUFE
  const cufeString = [
    invoiceNumber,
    issueDate, // Formato: YYYYMMDD
    issueTime, // Formato: HHMMSS-05:00
    formattedSubtotal,
    '01', // Código impuesto IVA
    formattedTax,
    '0', // Código impuesto INC (0 si no aplica)
    '0.00',
    '0', // Código impuesto INC (0 si no aplica)
    '0.00',
    formattedTotal,
    nit,
    customerDocumentType,
    customerDocumentNumber,
    technicalKey,
    testSetId
  ].join('');
  
  // Generar SHA-384
  const hash = crypto
    .createHash('sha384')
    .update(cufeString)
    .digest('hex');
  
  return hash;
}