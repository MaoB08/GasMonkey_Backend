import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD
  }
});

// Función para 2FA
export async function sendVerificationCode(email, code) {
  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: 'Código de Verificación - Gas Monkey',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #4D6C98;">Código de Verificación</h2>
        <p>Tu código de verificación es:</p>
        <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
          ${code}
        </div>
        <p style="color: #666; margin-top: 20px;">Este código expira en 5 minutos.</p>
        <p style="color: #666;">Si no solicitaste este código, ignora este correo.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de verificación enviado a:', email);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    return false;
  }
}

// ✅ Nueva función para recuperación de contraseña
export async function sendPasswordResetCode(email, code, firstName) {
  const mailOptions = {
    from: EMAIL_USER,
    to: email,
    subject: 'Recuperación de Contraseña - Gas Monkey',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">Gas Monkey</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hola ${firstName || 'Usuario'},</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Tu código de recuperación es:
          </p>
          
          <div style="background: #f7f7f7; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4D6C98;">
              ${code}
            </div>
          </div>
          
          <p style="color: #999; font-size: 14px; line-height: 1.6;">
            ⏰ Este código expira en <strong>15 minutos</strong>.
          </p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 4px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>⚠️ Importante:</strong> Si no solicitaste este cambio, ignora este correo y tu contraseña permanecerá sin cambios.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>Este es un correo automático, por favor no respondas.</p>
          <p>© ${new Date().getFullYear()} Gas Monkey. Todos los derechos reservados.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de recuperación enviado a:', email);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email de recuperación:', error.message);
    return false;
  }
}

export default transporter;