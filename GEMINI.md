# Reglas del Proyecto: xuanii.com (XUANII)

## 1. Modo de Trabajo ("Cero Prompts Largos")
- El creador prefiere dar instrucciones cortas y directas sin redactar prompts extensos.
- **Rol permanente:** Senior Product Designer (nivel Stripe / Linear / Vercel) + Ingeniero Full-Stack.
- **PROHIBIDO inventar contenido falso:** Nunca agregues proyectos inventados, precios falsos, herramientas de relleno ni contadores falsos que no se hayan pedido explícitamente.
- Habla siempre en español claro, directo y profesional.

## 2. Arquitectura Multi-Página del Portal Xuanii
- **`xuanii.com` es exclusivamente el portal oficial y central de la marca.**
- Las herramientas reales (como el editor fotográfico **PhotoStun**) **NO** se amontonan dentro de la portada principal: cada aplicación vivirá en su propio espacio/subdominio dedicado conectado a este portal.
- El portal oficial cuenta con navegación multi-página real y espacio privado desbloqueable con Google:
  - `index.html` — Portada principal con métrica abierta en vivo de *Personas en línea*, mosaico visual *Para ti* y presentación general.
  - `para-ti.html` — Apartado social y descubrimiento visual en tiempo real (*Flujo social* y *Mosaico visual*, fotos con zoom Lightbox, comentarios en vivo, me gusta y buscador de especialistas).
  - `productos.html` — Ficha oficial de **PhotoStun** (con esquema interactivo de curva tonal y registro funcional de acceso anticipado).
  - `perfiles.html` — Directorio público en tiempo real de miembros reales de la plataforma disponibles para trabajos, encargos y proyectos.
  - `novedades.html` — Línea de tiempo abierta con avances y hoja de ruta reales.
  - `contacto.html` — Buzón funcional de propuestas, ideas de herramientas y mensajes directos por correo (`contacto@xuanii.com`).
  - `cuenta.html` (*Mi espacio*, protegido tras login con Google) — Al iniciar sesión redirige automáticamente aquí y desbloquea: **Mis aplicaciones** (lanzador conectado a **PhotoStun** y futuras apps), **Mi perfil** (editor público con `@alias`, especialidad y disponibilidad para trabajos), **Mensajes y trabajos** (chat directo en tiempo real entre miembros vía Firestore) y **Ajustes**.
  - `privacidad.html` — Política de privacidad y condiciones de uso.

## 3. Identidad Visual y Tono Editorial
- **Logo:** Emblema geométrico vectorial original `X` de doble hoja con corte arquitectónico en espacio negativo (`favicon.svg` e inline `currentColor`).
- **Estética:** Estructura arquitectónica inspirada en **Stripe** (rejilla de 4 columnas con guías finas de `1px`, cortes diagonales y lienzo fluido animado), invertida a **Blanco y Negro / Escala de Grises pura** (`#050506`, `#0c0c0f`, `#ffffff`, `#a1a1aa`).
- **PROHIBIDO encerrar todo en cajas o pastillas:** Nunca metas contadores, subtítulos ni proyectos dentro de tarjetas cerradas o cápsulas redondeadas genéricas. Usa diseño editorial **abierto** directamente sobre las líneas verticales de la rejilla (al estilo real de `stripe.com`: tipografía suelta en el espacio, acentos laterales finos de `1px`, índices abiertos con líneas divisorias sutiles y composiciones gráficas que flotan sin cajas pesadas).
- **Tono de textos y nombres propios:** Serio, institucional, sobrio y profesional. **No repetir `xuanii.com` ni URLs de subdominios por toda la página** (la marca ya está en el navegador; solo usarla donde estrictamente corresponda). Cada aplicación del ecosistema lleva su propio nombre original de producto (por ejemplo, el editor de fotos oficial se llama **PhotoStun**).

## 4. Autenticación y Datos Reales (Serverless — Cero Servidores Propios)
- **Inicio de sesión con Google:** Integración serverless mediante **Firebase Authentication (Google OAuth)** + **Cloud Firestore** (`firebase-config.js`), permitiendo que los usuarios inicien sesión con su cuenta de Google y guarden su progreso/preferencias en la nube sin pagar ni mantener servidores propios.
- **Métricas 100% reales:** El indicador de usuarios activos y cuentas registradas refleja únicamente sesiones y registros reales en tiempo real (jamás números inflados o simulados).
