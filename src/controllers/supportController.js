import { sendSupportEmail } from '../services/emailService.js';

/**
 * Envía un mensaje de soporte por email
 */
export const sendSupportMessage = async (req, res) => {
    try {
        const { nombre, email, asunto, mensaje } = req.body;

        // Validar campos requeridos
        if (!nombre || !email || !asunto || !mensaje) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son requeridos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'El formato del email no es válido'
            });
        }

        // Enviar email
        const result = await sendSupportEmail({
            nombre,
            email,
            asunto,
            mensaje
        });

        res.status(200).json({
            success: true,
            message: 'Mensaje enviado exitosamente',
            messageId: result.messageId
        });

    } catch (error) {
        console.error('Error en sendSupportMessage:', error);
        res.status(500).json({
            success: false,
            error: 'Error al enviar el mensaje. Por favor, intenta nuevamente.'
        });
    }
};

export default {
    sendSupportMessage
};
