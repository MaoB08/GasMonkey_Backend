import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateInvoicePDF = (sale, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            // Crear documento PDF
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            // Encabezado
            doc.fontSize(20).text('FACTURA DE VENTA', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Factura #${sale.cod_sale}`, { align: 'right' });
            doc.text(`Fecha: ${new Date(sale.date).toLocaleDateString('es-CO')}`, { align: 'right' });
            doc.moveDown();

            // Información del cliente
            doc.fontSize(14).text('CLIENTE', { underline: true });
            doc.fontSize(10);
            if (sale.client) {
                const clientName = sale.client.business_name ||
                    `${sale.client.first_name} ${sale.client.middle_name || ''} ${sale.client.last_name1} ${sale.client.last_name2 || ''}`.trim();
                doc.text(`Nombre: ${clientName}`);
                doc.text(`Documento: ${sale.client.document_number}`);
                if (sale.client.email) doc.text(`Email: ${sale.client.email}`);
                if (sale.client.phone) doc.text(`Teléfono: ${sale.client.phone}`);
            }
            doc.moveDown();

            // Información de pago
            doc.fontSize(14).text('INFORMACIÓN DE PAGO', { underline: true });
            doc.fontSize(10);
            doc.text(`Estado: ${sale.state === 'PAID' ? 'Pagado' : sale.state === 'PENDING' ? 'Pendiente' : 'Crédito'}`);
            doc.text(`Método de pago: ${sale.payment_status}`);
            if (sale.paymentMethod) {
                doc.text(`Forma de pago: ${sale.paymentMethod.name}`);
            }
            doc.moveDown();

            // Tabla de productos
            doc.fontSize(14).text('PRODUCTOS', { underline: true });
            doc.moveDown(0.5);

            // Encabezados de tabla
            const tableTop = doc.y;
            const col1 = 50;
            const col2 = 250;
            const col3 = 320;
            const col4 = 380;
            const col5 = 450;

            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Producto', col1, tableTop);
            doc.text('Cant.', col2, tableTop);
            doc.text('Precio', col3, tableTop);
            doc.text('Desc.', col4, tableTop);
            doc.text('Total', col5, tableTop);

            doc.font('Helvetica');
            let yPosition = tableTop + 20;

            // Productos
            if (sale.details) {
                sale.details.forEach((detail) => {
                    const lineTotal = parseFloat(detail.quantity) * parseFloat(detail.unit_price);
                    const lineDiscount = parseFloat(detail.discount_amount);
                    const lineTax = parseFloat(detail.tax_amount);
                    const total = lineTotal - lineDiscount + lineTax;

                    doc.text(detail.product_name.substring(0, 30), col1, yPosition, { width: 190 });
                    doc.text(detail.quantity.toString(), col2, yPosition);
                    doc.text(`$${parseFloat(detail.unit_price).toLocaleString('es-CO')}`, col3, yPosition);
                    doc.text(detail.discount_percentage > 0 ? `${detail.discount_percentage}%` : '-', col4, yPosition);
                    doc.text(`$${total.toLocaleString('es-CO')}`, col5, yPosition);

                    yPosition += 20;

                    // Nueva página si es necesario
                    if (yPosition > 700) {
                        doc.addPage();
                        yPosition = 50;
                    }
                });
            }

            // Línea separadora
            doc.moveDown();
            doc.moveTo(col1, yPosition + 10)
                .lineTo(550, yPosition + 10)
                .stroke();

            yPosition += 30;

            // Totales
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Subtotal:', 400, yPosition);
            doc.text(`$${parseFloat(sale.subtotal).toLocaleString('es-CO')}`, 480, yPosition, { align: 'right' });
            yPosition += 20;

            if (sale.discount_amount > 0) {
                doc.text('Descuento:', 400, yPosition);
                doc.text(`-$${parseFloat(sale.discount_amount).toLocaleString('es-CO')}`, 480, yPosition, { align: 'right' });
                yPosition += 20;
            }

            doc.text('IVA:', 400, yPosition);
            doc.text(`$${parseFloat(sale.tax).toLocaleString('es-CO')}`, 480, yPosition, { align: 'right' });
            yPosition += 20;

            doc.fontSize(12);
            doc.text('TOTAL:', 400, yPosition);
            doc.text(`$${parseFloat(sale.total).toLocaleString('es-CO')}`, 480, yPosition, { align: 'right' });

            // Si es APARTADO, mostrar saldo pendiente
            if (sale.payment_status === 'APARTADO' || sale.payment_status === 'CREDIT') {
                yPosition += 30;
                doc.fontSize(10);
                doc.text('Pago inicial:', 400, yPosition);
                doc.text(`$${parseFloat(sale.initial_payment || 0).toLocaleString('es-CO')}`, 480, yPosition, { align: 'right' });

                // Calcular saldo pendiente
                const totalPaid = sale.payments ? sale.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) : parseFloat(sale.initial_payment || 0);
                const remaining = parseFloat(sale.total) - totalPaid;

                yPosition += 20;
                doc.font('Helvetica-Bold');
                doc.text('Saldo Pendiente:', 400, yPosition);
                doc.text(`$${remaining.toLocaleString('es-CO')}`, 480, yPosition, { align: 'right' });
            }

            // Notas
            if (sale.notes) {
                doc.moveDown(2);
                doc.fontSize(10).font('Helvetica');
                doc.text('Notas:', { underline: true });
                doc.text(sale.notes);
            }

            // Pie de página - usar posición relativa en lugar de fija
            doc.moveDown(3);
            doc.fontSize(8).font('Helvetica');
            doc.text(
                'Gracias por su compra',
                { align: 'center' }
            );

            // Finalizar PDF
            doc.end();

            stream.on('finish', () => {
                resolve(outputPath);
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
};
