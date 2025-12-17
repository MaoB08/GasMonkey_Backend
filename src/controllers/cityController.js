import { City } from '../models/index.js';

const cityController = {
    /**
     * Get all cities
     */
    getAllCities: async (req, res) => {
        try {
            const cities = await City.findAll({
                order: [['department', 'ASC'], ['name', 'ASC']]
            });

            res.json({
                success: true,
                data: cities
            });
        } catch (error) {
            console.error('❌ Error al obtener ciudades:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener las ciudades',
                details: error.message
            });
        }
    }
};

export default cityController;
