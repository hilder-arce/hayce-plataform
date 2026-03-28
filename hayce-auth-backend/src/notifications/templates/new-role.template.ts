export const newRoleTemplate = ({
  nombreRol,
  creadoPor,
  fecha,
}: {
  nombreRol: string;
  creadoPor: string;
  fecha: string;
}) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Nuevo Rol Creado</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f1f5f9;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:40px 20px;">

<table width="600" cellpadding="0" cellspacing="0" style="
  background:#ffffff;
  border-radius:12px;
  overflow:hidden;
  box-shadow:0 8px 24px rgba(0,0,0,0.05);
">

<!-- HEADER -->

<tr>
<td style="
  background:linear-gradient(135deg,#1a1a2e,#16213e);
  padding:32px;
  text-align:center;
">
  <h1 style="
    color:#ffffff;
    margin:0;
    font-size:22px;
    font-weight:600;
    letter-spacing:0.5px;
  ">
  👥 Nuevo rol registrado
  </h1>
</td>
</tr>

<!-- BODY -->

<tr>
<td style="padding:36px 40px; color:#1e293b;">

<p style="margin-top:0; font-size:15px; line-height:1.6;">
Se ha creado un <strong>nuevo rol</strong> dentro del sistema.  
A continuación se muestran los detalles del registro:
</p>

<!-- CARD INFO -->

<table width="100%" cellpadding="0" cellspacing="0" style="
  margin-top:24px;
  background:#f8fafc;
  border-radius:8px;
  border:1px solid #e2e8f0;
">

<tr>
<td style="padding:20px;">

<p style="margin:8px 0; font-size:14px;">
<strong>Rol:</strong> ${nombreRol}
</p>

<p style="margin:8px 0; font-size:14px;">
<strong>Creado por:</strong> ${creadoPor}
</p>

<p style="margin:8px 0; font-size:14px;">
<strong>Fecha:</strong> ${fecha}
</p>

</td>
</tr>

</table>

<p style="
  margin-top:28px;
  font-size:13px;
  color:#64748b;
  line-height:1.5;
">
Este correo es una notificación automática del sistema para registrar
cambios administrativos dentro de la plataforma.
</p>

</td>
</tr>

<!-- FOOTER -->

<tr>
<td style="
  background:#f8fafc;
  text-align:center;
  padding:20px;
  font-size:12px;
  color:#94a3b8;
">

<strong>Hilder Arce</strong><br/>
© ${new Date().getFullYear()} Todos los derechos reservados

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;
