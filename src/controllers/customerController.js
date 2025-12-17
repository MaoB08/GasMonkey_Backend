import Customer from '../models/Customer.js';
import { Client } from '../models/index.js';

const customerController = {
    /**
     * Search customer by document number
     * Busca en ambas tablas: customers (sistema antiguo) y clients (sistema nuevo)
     */
    searchByDocument: async (req, res) => {
        try {
            const { document } = req.query;

            if (!document) {
                return res.status(400).json({ error: 'El parámetro "document" es requerido' });
            }

            // Primero buscar en la tabla customers (sistema antiguo de facturas)
            let customer = await Customer.findOne({
                where: { document_number: document }
            });

            // Si no se encuentra, buscar en la tabla clients (sistema nuevo)
            if (!customer) {
                const client = await Client.findOne({
                    where: { document_number: document }
                });

                // Si se encuentra en clients, convertir al formato de customer
                if (client) {
                    return res.json({
                        customer: {
                            id: client.id,
                            document_number: client.document_number,
                            first_name: client.first_name,
                            last_name: `${client.last_name1} ${client.last_name2 || ''}`.trim(),
                            business_name: null, // Los clients no tienen business_name
                            email: client.email
                        }
                    });
                }
            }

            if (!customer) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }

            return res.json({
                customer: {
                    id: customer.id,
                    document_number: customer.document_number,
                    first_name: customer.first_name,
                    last_name: customer.last_name,
                    business_name: customer.business_name,
                    email: customer.email
                }
            });

        } catch (error) {
            console.error('❌ Error buscando cliente:', error);
            return res.status(500).json({
                error: 'Error al buscar cliente',
                detail: error.message
            });
        }
    }
};

export default customerController;
