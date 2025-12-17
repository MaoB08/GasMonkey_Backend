import User from '../models/User.js';

// Listar personal activo
export const listStaff = async (req, res) => {
    try {
        const staff = await User.findAll({
            where: {
                STF_Active: '1'
            },
            attributes: ['STF_ID', 'STF_First_Name', 'STF_Middle_Name', 'STF_First_Surname', 'STF_Second_Surname', 'STF_Role', 'STF_Department'],
            order: [['STF_First_Name', 'ASC']]
        });

        // Formatear respuesta
        const formattedStaff = staff.map(s => ({
            id: s.STF_ID,
            firstName: s.STF_First_Name,
            middleName: s.STF_Middle_Name,
            firstSurname: s.STF_First_Surname,
            secondSurname: s.STF_Second_Surname,
            fullName: `${s.STF_First_Name} ${s.STF_Middle_Name || ''} ${s.STF_First_Surname} ${s.STF_Second_Surname || ''}`.trim(),
            role: s.STF_Role,
            department: s.STF_Department
        }));

        res.json({ staff: formattedStaff });
    } catch (error) {
        console.error('Error listando personal:', error);
        res.status(500).json({ error: 'Error al listar personal' });
    }
};
