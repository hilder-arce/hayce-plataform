export const changePasswordTemplate = ({
  nombre,
  fecha,
}: {
  nombre: string;
  fecha: string;
}) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Contraseña actualizada</title>
</head>

<body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:40px 16px;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

<!-- CARD -->
<tr>
<td style="background:white;border-radius:16px;padding:40px;border:1px solid #e5e7eb;">

<!-- ICON -->
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:#ecfdf5;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;">
🔒
</div>
</div>

<!-- TITLE -->
<p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;text-align:center;">
Contraseña actualizada
</p>

<p style="margin:0 0 28px;font-size:14px;color:#6b7280;text-align:center;line-height:1.6;">
Hola <strong>${nombre}</strong>, tu contraseña fue modificada correctamente.
</p>

<!-- INFO BOX -->
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">

<tr>
<td style="padding:14px 18px;">
<p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;letter-spacing:1px;">
Fecha del cambio
</p>

<p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">
${fecha}
</p>
</td>
</tr>

</table>

<!-- SPACE -->
<div style="height:28px;"></div>

<!-- SECURITY ALERT -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
<tr>
<td style="padding:14px 16px;font-size:13px;color:#9a3412;line-height:1.6;">
⚠️ Si no realizaste este cambio, protege tu cuenta inmediatamente y contacta al administrador.
</td>
</tr>
</table>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="padding-top:26px;text-align:center;">

<p style="margin:0;font-size:11px;color:#9ca3af;">
Este correo fue generado automáticamente por el sistema de seguridad.
</p>

<p style="margin:6px 0 0;font-size:11px;color:#d1d5db;">
© ${new Date().getFullYear()} Hilder Arce · Todos los derechos reservados
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;
