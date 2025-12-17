import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configurar el transportador de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verificar la configuración del transportador
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Error en configuración de email:', error);
    } else {
        console.log('✅ Servidor de email listo para enviar mensajes');
    }
});

/**
 * Envía un email de soporte
 * @param {Object} data - Datos del formulario de soporte
 * @param {string} data.nombre - Nombre del remitente
 * @param {string} data.email - Email del remitente
 * @param {string} data.asunto - Asunto del mensaje
 * @param {string} data.mensaje - Mensaje del remitente
 * @returns {Promise} - Resultado del envío
 */
export const sendSupportEmail = async (data) => {
    const { nombre, email, asunto, mensaje } = data;

    const mailOptions = {
        from: `"${nombre}" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // mjbecerran@ufpso.edu.co
        replyTo: email,
        subject: `[Soporte GasMonkey] ${asunto}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🐵 GasMonkey</h1>
                    <p style="color: #f0f0f0; margin: 5px 0 0 0;">Centro de Soporte</p>
                </div>
                
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2 style="color: #333; margin-top: 0;">Nuevo mensaje de soporte</h2>
                    
                    <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 10px 0;"><strong style="color: #667eea;">👤 Nombre:</strong> ${nombre}</p>
                        <p style="margin: 10px 0;"><strong style="color: #667eea;">📧 Email:</strong> <a href="mailto:${email}" style="color: #764ba2;">${email}</a></p>
                        <p style="margin: 10px 0;"><strong style="color: #667eea;">📋 Asunto:</strong> ${asunto}</p>
                    </div>
                    
                    <div style="background-color: white; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #667eea; margin-top: 0;">💬 Mensaje:</h3>
                        <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${mensaje}</p>
                    </div>
                </div>
                
                <div style="padding: 15px; background-color: #f0f0f0; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; color: #888;">
                    <p style="margin: 0;">Este mensaje fue enviado desde el formulario de soporte de GasMonkey</p>
                    <p style="margin: 5px 0 0 0;">Para responder, usa el botón "Responder" o envía un email a: ${email}</p>
                </div>
            </div>
        `,
        text: `
Nuevo mensaje de soporte - GasMonkey

Nombre: ${nombre}
Email: ${email}
Asunto: ${asunto}

Mensaje:
${mensaje}

---
Este mensaje fue enviado desde el formulario de soporte de GasMonkey.
Para responder, envía un email a: ${email}
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de soporte enviado:', info.messageId);
        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        console.error('❌ Error al enviar email de soporte:', error);
        throw error;
    }
};

export default {
    sendSupportEmail
};
