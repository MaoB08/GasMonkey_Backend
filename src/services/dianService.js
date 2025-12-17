import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

/**
 * URLs de la DIAN
 */
const DIAN_URLS = {
  // Ambiente de habilitación (pruebas)
  habilitacion: {
    sendInvoice: 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc/SendBillSync',
    sendTestSet: 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc/SendTestSetAsync',
    getStatus: 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc/GetStatus'
  },
  // Ambiente de producción
  produccion: {
    sendInvoice: 'https://vpfe.dian.gov.co/WcfDianCustomerServices.svc/SendBillSync',
    getStatus: 'https://vpfe.dian.gov.co/WcfDianCustomerServices.svc/GetStatus'
  }
};

/**
 * Enviar factura a la DIAN
 */
export async function sendInvoiceToDIAN(invoiceData, environment = 'habilitacion') {
  try {
    const { xmlContent, nit, softwareId, softwarePin } = invoiceData;
    
    // Crear ZIP con el XML (la DIAN requiere ZIP)
    const zipBuffer = await createZipWithXML(xmlContent, invoiceData.full_number);
    
    // Preparar el body del request
    const requestBody = {
      NIT: nit,
      InvoiceNumber: invoiceData.full_number,
      IssueDate: invoiceData.issue_date,
      InvoiceFile: zipBuffer.toString('base64'),
      SoftwareId: softwareId,
      SoftwarePin: softwarePin
    };

    // Headers requeridos por DIAN
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Hacer el request a DIAN
    const url = DIAN_URLS[environment].sendInvoice;
    
    console.log('📤 Enviando factura a DIAN:', invoiceData.full_number);
    
    const response = await axios.post(url, requestBody, { 
      headers,
      timeout: 30000 // 30 segundos
    });

    console.log('✅ Respuesta de DIAN:', response.data);

    return {
      success: true,
      trackId: response.data.trackId,
      statusCode: response.data.statusCode,
      statusDescription: response.data.statusDescription,
      response: response.data
    };

  } catch (error) {
    console.error('❌ Error al enviar a DIAN:', error);
    
    return {
      success: false,
      error: error.message,
      response: error.response?.data || null
    };
  }
}

/**
 * Consultar estado de una factura en DIAN
 */
export async function getInvoiceStatus(trackId, nit, environment = 'habilitacion') {
  try {
    const url = DIAN_URLS[environment].getStatus;
    
    const response = await axios.post(url, {
      TrackId: trackId,
      NIT: nit
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return {
      success: true,
      status: response.data.status,
      statusCode: response.data.statusCode,
      statusDescription: response.data.statusDescription,
      errors: response.data.errors || [],
      response: response.data
    };

  } catch (error) {
    console.error('❌ Error al consultar estado:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Crear archivo ZIP con el XML (requerido por DIAN)
 */
async function createZipWithXML(xmlContent, fileName) {
  const AdmZip = require('adm-zip');
  const zip = new AdmZip();
  
  zip.addFile(`${fileName}.xml`, Buffer.from(xmlContent, 'utf8'));
  
  return zip.toBuffer();
}

/**
 * Validar estructura antes de enviar
 */
export function validateBeforeSend(invoiceData) {
  const errors = [];

  if (!invoiceData.cufe) {
    errors.push('CUFE no generado');
  }

  if (!invoiceData.xmlContent) {
    errors.push('XML no generado');
  }

  if (!invoiceData.company?.nit) {
    errors.push('NIT del emisor requerido');
  }

  if (!invoiceData.company?.software_id) {
    errors.push('Software ID no configurado');
  }

  if (!invoiceData.customer?.document_number) {
    errors.push('Documento del cliente requerido');
  }

  if (invoiceData.total <= 0) {
    errors.push('Total debe ser mayor a 0');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}