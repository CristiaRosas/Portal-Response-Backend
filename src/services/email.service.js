import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const plantillasEmail = {
  pendiente: (pedido, usuario, emailDestino) => ({
    subject: `✅ Pedido Confirmado - ${pedido.codigoSeguimiento}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Tu pedido ha sido confirmado!</h2>
        <p>Hola <strong>${usuario.name} ${usuario.surname}</strong>,</p>
        <p>Tu pedido con código <strong>${pedido.codigoSeguimiento}</strong> ha sido confirmado y está siendo procesado.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Resumen del pedido:</h3>
          <p><strong>Total:</strong> Q.${pedido.total}</p>
          <p><strong>Dirección de entrega:</strong> ${pedido.direccionEntrega}</p>
          <p><strong>Teléfono de contacto:</strong> ${pedido.telefonoContacto}</p>
        </div>

        <p>Puedes rastrear tu pedido en cualquier momento usando este código: <strong>${pedido.codigoSeguimiento}</strong></p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Notificaciones enviadas a: ${emailDestino}
        </p>
      </div>
    `,
  }),

  confirmado: (pedido, usuario, emailDestino) => ({
    subject: `🔄 Pedido en Preparación - ${pedido.codigoSeguimiento}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">¡Tu pedido está en preparación!</h2>
        <p>Hola <strong>${usuario.name} ${usuario.surname}</strong>,</p>
        <p>Tu pedido <strong>${pedido.codigoSeguimiento}</strong> ha sido confirmado y está siendo preparado para el envío.</p>
        
        <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Próximos pasos:</h3>
          <p>• Estamos preparando tus productos</p>
          <p>• Pronto recibirás una actualización cuando esté en camino</p>
          <p>• Tiempo estimado de preparación: 1-2 días hábiles</p>
        </div>

        <p><strong>Código de seguimiento:</strong> ${pedido.codigoSeguimiento}</p>
        <p style="color: #6b7280; font-size: 14px;">Notificaciones enviadas a: ${emailDestino}</p>
      </div>
    `,
  }),

  "en preparacion": (pedido, usuario, emailDestino) => ({
    subject: `📦 Pedido Empacado - ${pedido.codigoSeguimiento}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">¡Tu pedido está empacado!</h2>
        <p>Hola <strong>${usuario.name} ${usuario.surname}</strong>,</p>
        <p>Tu pedido <strong>${pedido.codigoSeguimiento}</strong> ha sido empacado y está listo para ser enviado.</p>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Estado actual:</h3>
          <p>✅ Productos verificados</p>
          <p>✅ Empaquetado completado</p>
          <p>🔄 Esperando transporte</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Notificaciones enviadas a: ${emailDestino}</p>
      </div>
    `,
  }),

  "en camino": (pedido, usuario, emailDestino) => ({
    subject: `🚚 Pedido en Camino - ${pedido.codigoSeguimiento}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">¡Tu pedido está en camino!</h2>
        <p>Hola <strong>${usuario.name} ${usuario.surname}</strong>,</p>
        <p>¡Excelentes noticias! Tu pedido <strong>${pedido.codigoSeguimiento}</strong> ya está en reparto.</p>
        
        <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Información de entrega:</h3>
          <p><strong>Dirección:</strong> ${pedido.direccionEntrega}</p>
          <p><strong>Teléfono de contacto:</strong> ${pedido.telefonoContacto}</p>
          <p><strong>Tiempo estimado de entrega:</strong> 1-3 días hábiles</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Notificaciones enviadas a: ${emailDestino}</p>
      </div>
    `,
  }),

  entregado: (pedido, usuario, emailDestino) => ({
    subject: `🎉 Pedido Entregado - ${pedido.codigoSeguimiento}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">¡Pedido entregado exitosamente!</h2>
        <p>Hola <strong>${usuario.name} ${usuario.surname}</strong>,</p>
        <p>Tu pedido <strong>${pedido.codigoSeguimiento}</strong> ha sido entregado satisfactoriamente.</p>
        
        <div style="background: #f3e8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">¡Gracias por tu compra!</h3>
          <p>Esperamos que disfrutes tus productos.</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Notificaciones enviadas a: ${emailDestino}</p>
      </div>
    `,
  }),

  cancelado: (pedido, usuario, emailDestino, razonCancelacion = "") => ({
  subject: `❌ Pedido Cancelado - ${pedido.codigoSeguimiento}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Pedido cancelado</h2>
      <p>Hola <strong>${usuario.name} ${usuario.surname}</strong>,</p>
      <p>Tu pedido <strong>${pedido.codigoSeguimiento}</strong> ha sido cancelado.</p>
      
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Información de cancelación:</h3>
        <p><strong>Razón de cancelación:</strong> ${razonCancelacion || "No se especificó razón"}</p>
        <p><strong>Total del pedido:</strong> Q.${pedido.total}</p>
        <p><strong>Fecha de cancelación:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Código de seguimiento:</strong> ${pedido.codigoSeguimiento}</p>
      </div>

      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0;">¿Qué pasa ahora?</h4>
        <p>• El importe será reembolsado en un plazo de 3-5 días hábiles</p>
        <p>• El stock de los productos ha sido restaurado</p>
        <p>• Si tienes dudas, contacta con nuestro servicio al cliente</p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">Notificaciones enviadas a: ${emailDestino}</p>
    </div>
  `,
}),
};

export const enviarEmailNotificacion = async (pedido, usuario, estado, emailDestino, observaciones = "") => {
  try {
    const plantilla = plantillasEmail[estado];
    
    if (!plantilla) {
      console.log(`No hay plantilla definida para el estado: ${estado}`);
      return false;
    }

    const emailContent = plantilla(pedido, usuario, emailDestino, observaciones);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailDestino,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de notificación enviado a ${emailDestino} para el pedido ${pedido.codigoSeguimiento}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return false;
  }
};

export const verificarConfiguracionEmail = async () => {
  try {
    await transporter.verify();
    console.log('✅ Configuración de email verificada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error en la configuración de email:', error);
    return false;
  }
};