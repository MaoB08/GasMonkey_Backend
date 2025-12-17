import { Client, City } from '../models/index.js';
import { Op } from 'sequelize';

const clientController = {
    /**
     * Get all clients
     */
    getAllClients: async (req, res) => {
        try {
            const clients = await Client.findAll({
                include: [{
                    model: City,
                    as: 'city',
                    attributes: ['id', 'name', 'department']
                }],
                order: [['created_at', 'DESC']]
            });

            res.json({
                success: true,
                data: clients
            });
        } catch (error) {
            console.error('❌ Error al obtener clientes:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener los clientes',
                details: error.message
            });
        }
    },

    /**
     * Get client by ID
     */
    getClientById: async (req, res) => {
        try {
            const { id } = req.params;

            const client = await Client.findByPk(id, {
                include: [{
                    model: City,
                    as: 'city',
                    attributes: ['id', 'name', 'department']
                }]
            });

            if (!client) {
                return res.status(404).json({
                    success: false,
                    error: 'Cliente no encontrado'
                });
            }

            res.json({
                success: true,
                data: client
            });
        } catch (error) {
            console.error('❌ Error al obtener cliente:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener el cliente',
                details: error.message
            });
        }
    },

    /**
     * Create new client
     */
    createClient: async (req, res) => {
        try {
            const {
                document_type,
                document_number,
                first_name,
                middle_name,
                last_name1,
                last_name2,
                address,
                phone,
                email,
                city_id
            } = req.body;

            // Validate required fields
            if (!document_type || !document_number || !first_name || !last_name1) {
                return res.status(400).json({
                    success: false,
                    error: 'Los campos tipo de documento, número de documento, primer nombre y primer apellido son requeridos'
                });
            }

            // Check if document_number already exists
            const existingClient = await Client.findOne({
                where: { document_number }
            });

            if (existingClient) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe un cliente con este número de documento'
                });
            }

            const client = await Client.create({
                document_type,
                document_number,
                first_name,
                middle_name,
                last_name1,
                last_name2,
                address,
                phone,
                email,
                city_id
            });

            // Fetch the created client with city info
            const clientWithCity = await Client.findByPk(client.id, {
                include: [{
                    model: City,
                    as: 'city',
                    attributes: ['id', 'name', 'department']
                }]
            });

            res.status(201).json({
                success: true,
                message: 'Cliente creado exitosamente',
                data: clientWithCity
            });
        } catch (error) {
            console.error('❌ Error al crear cliente:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear el cliente',
                details: error.message
            });
        }
    },

    /**
     * Update client
     */
    updateClient: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                document_type,
                document_number,
                first_name,
                middle_name,
                last_name1,
                last_name2,
                address,
                phone,
                email,
                city_id
            } = req.body;

            const client = await Client.findByPk(id);

            if (!client) {
                return res.status(404).json({
                    success: false,
                    error: 'Cliente no encontrado'
                });
            }

            // Validate required fields
            if (!document_type || !document_number || !first_name || !last_name1) {
                return res.status(400).json({
                    success: false,
                    error: 'Los campos tipo de documento, número de documento, primer nombre y primer apellido son requeridos'
                });
            }

            // Check if document_number is being changed and if it already exists
            if (document_number !== client.document_number) {
                const existingClient = await Client.findOne({
                    where: {
                        document_number,
                        id: { [Op.ne]: id }
                    }
                });

                if (existingClient) {
                    return res.status(400).json({
                        success: false,
                        error: 'Ya existe otro cliente con este número de documento'
                    });
                }
            }

            await client.update({
                document_type,
                document_number,
                first_name,
                middle_name,
                last_name2,
                last_name2,
                address,
                phone,
                email,
                city_id
            });

            // Fetch updated client with city info
            const updatedClient = await Client.findByPk(id, {
                include: [{
                    model: City,
                    as: 'city',
                    attributes: ['id', 'name', 'department']
                }]
            });

            res.json({
                success: true,
                message: 'Cliente actualizado exitosamente',
                data: updatedClient
            });
        } catch (error) {
            console.error('❌ Error al actualizar cliente:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar el cliente',
                details: error.message
            });
        }
    },

    /**
     * Delete client
     */
    deleteClient: async (req, res) => {
        try {
            const { id } = req.params;

            const client = await Client.findByPk(id);

            if (!client) {
                return res.status(404).json({
                    success: false,
                    error: 'Cliente no encontrado'
                });
            }

            await client.destroy();

            res.json({
                success: true,
                message: 'Cliente eliminado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error al eliminar cliente:', error);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar el cliente',
                details: error.message
            });
        }
    },

    /**
     * Search client by document number
     */
    searchByDocument: async (req, res) => {
        try {
            const { document } = req.query;

            if (!document) {
                return res.status(400).json({
                    success: false,
                    error: 'El número de documento es requerido'
                });
            }

            const client = await Client.findOne({
                where: { document_number: document },
                include: [{
                    model: City,
                    as: 'city',
                    attributes: ['id', 'name', 'department']
                }]
            });

            if (!client) {
                return res.status(404).json({
                    success: false,
                    error: 'Cliente no encontrado'
                });
            }

            res.json({
                success: true,
                client: client
            });
        } catch (error) {
            console.error('❌ Error al buscar cliente:', error);
            res.status(500).json({
                success: false,
                error: 'Error al buscar el cliente',
                details: error.message
            });
        }
    }
};

export default clientController;
