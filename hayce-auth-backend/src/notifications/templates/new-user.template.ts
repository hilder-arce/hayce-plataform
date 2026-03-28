export const newUserTemplate = ({
  nombre,
  rol,
  creadoPor,
  fecha,
}: {
  nombre: string;
  rol: string;
  creadoPor: string;
  fecha: string;
}) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cuenta creada</title>
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
<div style="display:inline-block;background:#eef2ff;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;">
👤
</div>
</div>

<!-- TITLE -->
<p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;text-align:center;">
Tu cuenta ha sido creada
</p>

<p style="margin:0 0 30px;font-size:14px;color:#6b7280;text-align:center;line-height:1.6;">
Hola <strong>${nombre}</strong>, ahora tienes acceso al sistema.
Un administrador creó tu cuenta para que puedas comenzar a trabajar.
</p>

<!-- INFO BOX -->
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">

<tr>
<td style="padding:14px 18px;border-bottom:1px solid #f1f5f9;">
<p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;letter-spacing:1px;">
Rol asignado
</p>
<p style="margin:3px 0 0;font-size:14px;color:#111827;font-weight:600;">
${rol}
</p>
</td>
</tr>

<tr>
<td style="padding:14px 18px;border-bottom:1px solid #f1f5f9;">
<p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;letter-spacing:1px;">
Cuenta creada por
</p>
<p style="margin:3px 0 0;font-size:14px;color:#111827;font-weight:600;">
${creadoPor}
</p>
</td>
</tr>

<tr>
<td style="padding:14px 18px;">
<p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;letter-spacing:1px;">
Fecha de creación
</p>
<p style="margin:3px 0 0;font-size:14px;color:#111827;font-weight:600;">
${fecha}
</p>
</td>
</tr>

</table>

<div style="height:32px;"></div>

<!-- BUTTON -->
<div style="text-align:center;">
<a href="https://hilderarce.com"
style="display:inline-block;background:#0d6efd;color:white;text-decoration:none;padding:14px 42px;border-radius:8px;font-size:14px;font-weight:600;">
Ingresar al sistema
</a>
</div>

<div style="height:22px;"></div>

<p style="margin:0;text-align:center;font-size:13px;color:#9ca3af;">
Si no esperabas este acceso, contacta con el administrador del sistema.
</p>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="padding-top:28px;text-align:center;">

<p style="margin:0;font-size:11px;color:#9ca3af;">
Este correo fue generado automáticamente por el sistema.
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
