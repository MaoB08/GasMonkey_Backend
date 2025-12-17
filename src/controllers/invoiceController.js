// controllers/invoiceController.js
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import crypto from 'crypto';
import moment from 'moment';
import fs from 'fs';

import Invoice from '../models/Invoice.js';
import InvoiceItem from '../models/InvoiceItem.js';
import Company from '../models/Company.js';
import Customer from '../models/Customer.js';
import Resolution from '../models/Resolution.js';

import { generateCUFE } from '../services/cufeGenerator.js';
import { generateInvoiceXML } from '../services/xmlGenerator.js';
import { signXML } from '../services/xmlSigner.js';
import { sendInvoiceToDIAN, validateBeforeSend } from '../services/dianService.js';
import { generateInvoicePDF } from '../services/pdfGenerator.js';
import { validateInvoiceForDIAN } from '../services/dianValidator.js';
import invoiceService from '../services/invoiceService.js';

const invoiceController = {
  create: async (req, res) => {
    try {
      const invoice = await invoiceService.createInvoice(req.body);

      return res.status(201).json({
        message: 'Factura creada exitosamente (borrador)',
        invoice: {
          id: invoice.id,
          full_number: invoice.full_number,
          total: invoice.total,
          cufe: invoice.cufe,
          status: invoice.status
        }
      });

    } catch (error) {
      console.error('❌ Error creando factura:', error);

      if (error.message && error.message.startsWith('Número de factura ya existe')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message === 'Resolución agotada') {
        return res.status(400).json({ error: 'Resolución agotada' });
      }
      // Manejar otros errores de validación del servicio
      if (error.message === 'Empresa no encontrada' || error.message === 'Cliente no encontrado') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Error al crear factura', detail: error.message });
    }
  },

  /**
   * Enviar factura a la DIAN
   */
  sendToDIAN: async (req, res) => {
    try {
      const { id } = req.params;

      const invoice = await Invoice.findByPk(id, {
        include: [
          { model: Company },
          { model: Customer },
          { model: InvoiceItem },
          { model: Resolution }
        ]
      });

      if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' });
      if (invoice.status === 'accepted') return res.status(400).json({ error: 'Factura ya fue aceptada por DIAN' });

      // Validar antes de enviar
      const validation = validateBeforeSend(invoice);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Validación fallida',
          errors: validation.errors
        });
      }

      // Generar XML
      const xmlContent = generateInvoiceXML({
        company: invoice.Company,
        customer: invoice.Customer,
        invoice: invoice,
        items: invoice.InvoiceItems,
        cufe: invoice.cufe
      });

      // Firmar XML
      const signedXML = await signXML(
        xmlContent,
        invoice.Company.certificate_path,
        invoice.Company.certificate_password
      );

      // Guardar XML firmado
      invoice.xml_content = signedXML;
      await invoice.save();

      // Enviar a DIAN (ambiente según NODE_ENV)
      const env = process.env.NODE_ENV === 'production' ? 'produccion' : 'habilitacion';
      const dianResponse = await sendInvoiceToDIAN({
        xmlContent: signedXML,
        nit: invoice.Company.nit,
        softwareId: invoice.Company.software_id,
        softwarePin: invoice.Company.software_pin,
        full_number: invoice.full_number,
        issue_date: invoice.issue_date
      }, env);

      invoice.status = dianResponse.success ? 'sent' : 'error';
      invoice.dian_response = dianResponse.response || dianResponse.error || null;
      invoice.dian_sent_at = new Date();
      await invoice.save();

      // Generar PDF (no bloqueante del envío)
      try {
        const pdf = await generateInvoicePDF({
          company: invoice.Company.toJSON(),
          customer: invoice.Customer.toJSON(),
          invoice: invoice.toJSON(),
          items: invoice.InvoiceItems.map(i => i.toJSON()),
          cufe: invoice.cufe,
          resolution: invoice.Resolution ? invoice.Resolution.toJSON() : null
        });

        if (pdf && pdf.path) {
          invoice.pdf_path = pdf.path;
          await invoice.save();
        }
      } catch (pdfErr) {
        console.warn('⚠️ Error generando PDF:', pdfErr.message);
      }

      if (dianResponse.success) {
        return res.json({
          message: 'Factura enviada exitosamente a la DIAN',
          invoice: {
            id: invoice.id,
            full_number: invoice.full_number,
            cufe: invoice.cufe,
            status: invoice.status,
            trackId: dianResponse.trackId || null,
            pdf_path: invoice.pdf_path || null
          }
        });
      } else {
        return res.status(500).json({
          error: 'Error al enviar a DIAN',
          details: dianResponse.error || dianResponse,
          invoice: {
            id: invoice.id,
            status: invoice.status
          }
        });
      }
    } catch (error) {
      console.error('❌ Error enviando a DIAN:', error);
      return res.status(500).json({ error: 'Error al enviar factura a DIAN', detail: error.message });
    }
  },

  /**
   * Obtener factura por ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const invoice = await Invoice.findByPk(id, {
        include: [
          { model: Company },
          { model: Customer },
          { model: InvoiceItem },
          { model: Resolution }
        ]
      });

      if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' });

      return res.json({ invoice });
    } catch (error) {
      console.error('❌ Error obteniendo factura:', error);
      return res.status(500).json({ error: 'Error al obtener factura' });
    }
  },

  /**
   * Listar facturas con filtros y paginación
   */
  list: async (req, res) => {
    try {
      const {
        company_id,
        customer_id,
        status,
        start_date,  // Cambiado de from_date
        end_date,    // Cambiado de to_date
        customer_search,  // Nuevo parámetro para buscar por nombre o documento
        page = 1,
        limit = 20
      } = req.query;

      const where = {};
      const include = [
        { model: Company, attributes: ['id', 'business_name', 'nit'] },
        { model: Customer, attributes: ['id', 'document_number', 'business_name', 'first_name', 'last_name'] }
      ];

      if (company_id) where.company_id = company_id;
      if (customer_id) where.customer_id = customer_id;
      if (status) where.status = status;

      // Filtro por rango de fechas
      if (start_date && end_date) {
        where.issue_date = {
          [Op.between]: [start_date, end_date]
        };
      } else if (start_date) {
        where.issue_date = { [Op.gte]: start_date };
      } else if (end_date) {
        where.issue_date = { [Op.lte]: end_date };
      }

      // Búsqueda de cliente por nombre o documento
      if (customer_search) {
        include[1].where = {
          [Op.or]: [
            { document_number: { [Op.iLike]: `%${customer_search}%` } },
            { business_name: { [Op.iLike]: `%${customer_search}%` } },
            { first_name: { [Op.iLike]: `%${customer_search}%` } },
            { last_name: { [Op.iLike]: `%${customer_search}%` } }
          ]
        };
        include[1].required = true; // INNER JOIN para filtrar solo facturas con clientes que coincidan
      }

      const offset = (Math.max(parseInt(page, 10), 1) - 1) * parseInt(limit, 10);

      const { count, rows } = await Invoice.findAndCountAll({
        where,
        include,
        order: [['issue_date', 'DESC'], ['number', 'DESC']],
        limit: parseInt(limit, 10),
        offset,
        distinct: true // Para contar correctamente con JOINs
      });

      return res.json({
        total: count,
        page: parseInt(page, 10),
        pages: Math.ceil(count / limit),
        invoices: rows
      });
    } catch (error) {
      console.error('❌ Error listando facturas:', error);
      return res.status(500).json({ error: 'Error al listar facturas' });
    }
  },

  /**
   * Descargar PDF de factura
   */
  downloadPDF: async (req, res) => {
    try {
      const { id } = req.params;

      const invoice = await Invoice.findByPk(id, {
        include: [
          { model: Company },
          { model: Customer },
          { model: InvoiceItem },
          { model: Resolution }
        ]
      });

      if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' });

      // Verificar si el PDF existe en el sistema de archivos
      let pdfExists = false;
      if (invoice.pdf_path) {
        try {
          pdfExists = fs.existsSync(invoice.pdf_path);
        } catch (err) {
          console.warn('⚠️ Error verificando existencia del PDF:', err.message);
          pdfExists = false;
        }
      }

      // Generar PDF si no existe
      if (!invoice.pdf_path || !pdfExists) {
        console.log('📄 Generando PDF bajo demanda para factura:', invoice.full_number);

        try {
          const pdf = await generateInvoicePDF({
            company: invoice.Company.toJSON(),
            customer: invoice.Customer.toJSON(),
            invoice: invoice.toJSON(),
            items: invoice.InvoiceItems.map(i => i.toJSON()),
            cufe: invoice.cufe,
            resolution: invoice.Resolution ? invoice.Resolution.toJSON() : null
          });

          if (pdf && pdf.path) {
            invoice.pdf_path = pdf.path;
            await invoice.save();
            console.log('✅ PDF generado y guardado:', pdf.path);
          }
        } catch (pdfErr) {
          console.error('❌ Error generando PDF:', pdfErr);
          return res.status(500).json({
            error: 'Error al generar PDF',
            detail: pdfErr.message
          });
        }
      }

      // Descargar el PDF
      return res.download(invoice.pdf_path, `Factura_${invoice.full_number}.pdf`);
    } catch (error) {
      console.error('❌ Error descargando PDF:', error);
      return res.status(500).json({ error: 'Error al descargar PDF' });
    }
  },

  /**
   * Descargar XML de factura
   */
  downloadXML: async (req, res) => {
    try {
      const { id } = req.params;

      const invoice = await Invoice.findByPk(id);

      if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' });
      if (!invoice.xml_content) return res.status(404).json({ error: 'XML no generado aún' });

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename=Factura_${invoice.full_number}.xml`);
      return res.send(invoice.xml_content);
    } catch (error) {
      console.error('❌ Error descargando XML:', error);
      return res.status(500).json({ error: 'Error al descargar XML' });
    }
  },

  /**
   * Anular factura (crear nota crédito) - por ahora solo cambia estado
   */
  cancel: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) return res.status(400).json({ error: 'Debe proporcionar un motivo de anulación' });

      const invoice = await Invoice.findByPk(id);
      if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' });
      if (invoice.status === 'cancelled') return res.status(400).json({ error: 'Factura ya está anulada' });

      invoice.status = 'cancelled';
      invoice.cancellation_reason = reason;
      invoice.cancellation_date = new Date();
      await invoice.save();

      return res.json({
        message: 'Factura anulada exitosamente',
        invoice: {
          id: invoice.id,
          full_number: invoice.full_number,
          status: invoice.status
        }
      });
    } catch (error) {
      console.error('❌ Error anulando factura:', error);
      return res.status(500).json({ error: 'Error al anular factura' });
    }
  },

  /**
   * Validar factura según requisitos DIAN (sin enviar)
   */
  validate: async (req, res) => {
    try {
      const { id } = req.params;

      const invoice = await Invoice.findByPk(id, {
        include: [
          { model: Company },
          { model: Customer },
          { model: InvoiceItem },
          { model: Resolution }
        ]
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      // Ejecutar validaciones DIAN
      const validation = validateInvoiceForDIAN(
        invoice,
        invoice.Company,
        invoice.Customer,
        invoice.InvoiceItems,
        invoice.Resolution
      );

      return res.json({
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        invoice: {
          id: invoice.id,
          full_number: invoice.full_number,
          status: invoice.status,
          total: invoice.total
        }
      });

    } catch (error) {
      console.error('❌ Error validando factura:', error);
      return res.status(500).json({
        error: 'Error al validar factura',
        detail: error.message
      });
    }
  }
};

/**
 * Obtener código de tipo de documento según DIAN
 */
function getDocumentTypeCode(customerType) {
  const codes = {
    'NIT': '31',
    'CC': '13',
    'CE': '22',
    'Pasaporte': '41',
    'TI': '12',
    'RC': '11'
  };
  return codes[customerType] || '13';
}

export default invoiceController;
