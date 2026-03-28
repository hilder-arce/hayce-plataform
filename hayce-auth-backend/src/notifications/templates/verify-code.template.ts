export const verifyCodeTemplate = ({
  nombre,
  codigo,
}: {
  nombre: string;
  codigo: string;
}) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Código de verificación</title>
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
🔑
</div>
</div>

<!-- TITLE -->
<p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;text-align:center;">
Código de verificación
</p>

<p style="margin:0 0 28px;font-size:14px;color:#6b7280;text-align:center;line-height:1.6;">
Hola <strong>${nombre}</strong>, usa el siguiente código para continuar con la verificación.
</p>

<!-- CODE -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<div style="background:#0f172a;color:white;font-size:40px;font-weight:700;
letter-spacing:10px;padding:18px 28px;border-radius:10px;display:inline-block;">
${codigo}
</div>

</td>
</tr>
</table>

<div style="height:22px;"></div>

<p style="margin:0;text-align:center;font-size:13px;color:#6b7280;">
Este código expira en <strong>5 minutos</strong>.
</p>

<div style="height:26px;"></div>

<!-- ALERT -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff1f2;border:1px solid #fecaca;border-radius:10px;">
<tr>
<td style="padding:14px 16px;font-size:13px;color:#991b1b;line-height:1.6;">
Si no solicitaste este código, ignora este mensaje o revisa la seguridad de tu cuenta.
</td>
</tr>
</table>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="padding-top:28px;text-align:center;">

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
