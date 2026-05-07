# Plan SEO — gibravo.it (GiBravo Travel)

Documento de referencia para priorizar mejoras de posicionamiento orgánico. Última revisión sugerida: cada 3–6 meses según datos de Search Console.

---

## 1. Objetivos

- Captar búsquedas con **intención de contratar** viajes organizados desde **Milán** y alrededores.
- Reforzar **confianza** (Chi siamo, Come funziona, FAQ, Contatti).
- Hacer indexables y claras para Google las **partenze** y las **fichas de tour** (contenido único por URL).

**KPIs orientativos (revisar en Google Search Console):**

- Impresiones y clics en términos tipo *agenzia viaggi milano*, *viaggi organizzati*, *partenze*.
- Posición media y CTR en URLs clave: `/`, `/chi-siamo`, `/partenze`, `/categoria/*`, `/tour/*`.
- Core Web Vitals y velocidad en móvil (PageSpeed Insights / Lighthouse / CrUX) — objetivo estable: mejorar sobre el baseline revisado en § 5.1.

---

## 2. Palabras clave

### 2.1 Primarias (intención comercial + local)

| Keyword (IT) | Uso sugerido |
|----------------|--------------|
| agenzia di viaggi a Milano | Home, footer, Schema local, Google Business Profile |
| viaggi organizzati da Milano | Home, intro Partenze, categorías |
| tour in pullman da Milano / viaggi in autobus organizzati | Página bus / textos de categoría |
| viaggi organizzati in aereo da Milano | Página aereo / textos de categoría |
| agenzia viaggi gruppi Milano | Home, Chi siamo (si aplicable al negocio) |

### 2.2 Secundarias

| Keyword (IT) | Uso sugerido |
|----------------|--------------|
| viaggi organizzati Italia ed Europa | Home, breadcrumbs conceptuales, intros |
| tour guidati in pullman | Bus, fichas donde haya guía |
| partenze viaggi organizzati | Partenze (H1, primer párrafo, FAQs) |
| offerte viaggi gruppo | Home o bloque promocional (solo si hay ofertas reales) |

### 2.3 Long-tail (menos volumen, más conversión)

- agenzia viaggi Milano viaggi organizzati bus e aereo  
- partenze viaggi weekend da Milano *(si coincide con la oferta real)*  
- tour *[destino]* da Milano — una variante por **destinos fuertes** en fichas tour  

### 2.4 Marca

- **GiBravo Travel**, variantes con errores típicos — títulos secundarios, perfil Google, redes.

**Nota:** La meta `keywords` en HTML tiene **poco peso directo en Google**. Usad esta lista como **guía editorial**: H1, H2, primer párrafo y texto visible, sin repetición artificial (*keyword stuffing*).

---

## 3. Estrategia por tipo de página

| URL / tipo | Prioridad contenido |
|------------|---------------------|
| **Home** (`/`) | Mensaje único: agencia Milano + pullman/aereo + viajes organizados. Un solo H1 claro. |
| **Chi siamo** (`/chi-siamo`) | Credibilidad: quién sois, experiencia, ámbito territorial (Milán/Lombardía), por qué confiar. Datos verificables. |
| **Partenze** (`/partenze`) | Introducción indexable única; listados claros (fechas, destino, medio). Pensar en consultas tipo *partenze viaggi organizzati*. |
| **Categorías** (`/categoria/bus`, `/categoria/aereo`) | Páginas pilar con texto propio + FAQ corta + enlaces a partenze y tours. |
| **Tour** (`/tour/[slug]`) | Title y meta description **únicos por destino**. Imagen OG por tour si es posible. |
| **Come funziona / FAQ / Contatti** | Long-tail preguntas en H2/H3; formato útil para posibles fragmentos destacados. |

---

## 4. SEO local (Milán)

1. **Google Business Profile**: categoría adecuada (agenzia di viaggi), zona Milán/provincia, fotos, horarios, enlace a partenze y contatti.
2. **Coherencia NAP**: nombre, dirección (si hay sede física), teléfono **iguales** en web, footer y Google.
3. Menciones naturales *da Milano* / *in Lombardia* donde encaje, sin forzar.

---

## 5. Técnico (Next.js / proyecto)

Acciones alineadas con el estado actual del sitio (`metadata`, `metadataBase`, Open Graph, `robots.ts`, `sitemap.ts`):

| Acción | Detalle |
|--------|---------|
| **Schema.org JSON-LD** | `TravelAgency` en el layout del sitio (`OrganizationJsonLd`). Opcional: ampliar `sameAs` u horarios de apertura. |
| **Sitemap dinámico** | Incluir en `sitemap.xml` todas las URLs de tour/publicables para maximizar descubrimiento. |
| **Canonical y dominio** | Un solo dominio preferido (`www.gibravo.it` según configuración actual); evitar contenido duplicado http/https y www/non-www. |
| **Rendimiento** | Core Web Vitals, peso JS (Clerk, pixels marketing opcionales), hero LCP — ver **§ 5.1 Rendimiento**. |
| **Internal linking** | Desde home y categorías hacia Partenze y tours destacados; Chi siamo → Come funziona / Contatti. |

### 5.1 Rendimiento / PageSpeed (Google)

**Impacto indirecto SEO:** mejor experiencia → señales de calidad y Core Web Vitals; no sustituye a contenidos ni backlinks.

#### Baseline (PageSpeed Insights, móvil — captura equipo, 07/05/2026)

| Métrica (Lighthouse) | Valor aproximado | Notas |
|----------------------|------------------|--------|
| **Prestazioni (Performance)** | ~43 | Objetivo: subir paulatinamente (>60 como primer hito útil). |
| **SEO** | 100 | Aspectos técnicos básicos de Lighthouse bastante cubiertos. |
| **Accessibilità** | ~86 | Mejoras puntuales posibles sin confundir con «velocidad». |
| **Best practice** | ~92 | Revisión ocasional. |

Hallazgos relevantes del análisis (prioridad alta → baja):

1. **Cadenas de redirect** (~3 redirects, ~1,3–1,4 s de document latency en pruebas con `https://gibravo.it/`): usar **solo URL canónica** en enlaces/marketing (**`https://www.gibravo.it`**), activar **`www` + HTTPS** como dominio principal en el hosting / DNS (p. ej. Vercel) y **evitar enlaces HTTP o sin www**. En código: redirect **apex → www** desde middleware (308).
2. **JavaScript pesado** (mucho trabajo en thread principal / JS no utilizado; treemap con **Clerk**, pixel Meta, etc.): cargar scripts de marketing con baja prioridad; limitar terceros.
3. **Imágenes** (ahorro potencial alto en algunas vistas): formato moderno (**`f_auto`, `q_auto`** en Cloudinary), **`sizes`** en `next/image`, no apilar todas las slides del hero a la vez.
4. **`preconnect`**: no añadir muchos enlaces redundantes si Lighthouse lo marca como problema.
5. **Payload total** muy alto en algunos informes (**~4,4 MiB**): combinación de JS + imágenes; trabajar sobre (1)-(3).
6. **DOM grande**: simplificar marcado donde sea razonable; evitar loaders de pantalla completa largos que bloqueen la página.

#### Cambios ya aplicados en el repo (referencia desarrollo)

- Home **ISR** (`revalidate`): menos trabajo por request que `force-dynamic`; sin consultas Prisma en esta página (antes no alimentaban ningún bloque visible).
- Hero: **una sola imagen** activa + **Cloudinary** `f_auto,q_auto:good,w_1920,c_limit` + `sizes="100vw"`.
- `WelcomeLoader`: **menos intrusivo** (~550 ms como máximo, respeta «reduced motion», **sessionStorage** tras primera vista en la pestaña).
- **Formularios:** eliminado GoHighLevel/LeadConnector; **contacto** en `/contatti` con **`/api/contact`** + **Resend** (`RESEND_API_KEY`, opcional `CONTACT_INBOX_EMAIL`); **newsletter** en footer con **`/api/newsletter`** → misma bandeja.
- **Turnstile** (Cloudflare): widget en newsletter y contatti si hay `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; verificación servidor con `TURNSTILE_SECRET_KEY`. Honeypot en ambos formularios.
- Secciones bajo fold en home con **`next/dynamic`**.
- Middleware: redirect **`gibravo.it` → `www.gibravo.it`** (308).

#### Pendiente / fuera del código

- Consolidar redirects en **infraestructura** (HTTPS + www en el menor número de saltos posible según hosting).
- Revisión de **marketing tags** duplicados o pixel Meta si el peso JS sigue alto.
- Assets puntuales señalados por PSI por URL.
- **Anti-bot formularios:** configurar **Cloudflare Turnstile** en producción:
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (clave sitio, pública)
  - `TURNSTILE_SECRET_KEY` (secreto, solo servidor)  
  Sin estas variables el captcha no se muestra y el servidor **no** exige token (queda honeypot + validación básica — útil en local).

---

## 6. Contenidos y roadmap sugerido

### Fase 0 — Rendimiento (primer impacto UX + Core Web Vitals)

- [x] Baseline PSI móvil anotado en § 5.1.
- [x] Homepage: ISR, hero optimizado (1 slide activa), script formulario lazy, welcome loader menos agresivo, `dynamic` para bloques pesados bajo fold.
- [x] Redirect apex → `www` en middleware; en campañas y enlaces externos usar **`https://www.gibravo.it`**.
- [ ] Panel hosting: canonical domain + redirects para acortar cadenas HTTP/HTTPS/www.
- [ ] Auditoría scripts terceros (Meta pixel u otros).

### Fase 1 — Base (contenuti & meta)

- [x] Revisar H1 único por página y primer párrafo orientado a intención de búsqueda (home, chi siamo, partenze/categorie copy actualizado).
- [x] Revisar `title`, `description`, `canonical` y Open Graph en Home, Chi siamo, Partenze, Contatti, categorías `/categoria/aereo|bus`.
- [ ] **Google Business Profile** (acción manual en Google): categoría, horarios, URL `https://www.gibravo.it`, fotos.

### Fase 2 — Técnico y profundidad

- [x] JSON-LD **TravelAgency** (`OrganizationJsonLd` en layout website).
- [x] Completar sitemap con rutas de tour (`isActive` + `isPublic` + `slug`, deduplicación, `revalidate` 1 h).
- [x] `generateMetadata` per `/tour/[slug]`: titolo segment (template globale), description da subtitulo/descrizione o fallback “da Milano”, keywords, canonical, OG/Twitter, `noindex` se tour non pubblico/inattivo.
- [ ] Auditar fichas tour: textos únicos, FAQs donde aporte valor (contenido editorial).

### Fase 3 — Crecimiento (continuo)

- **Blog / artículos:** **no prioridad** — omitido por decisión del equipo (solo cuando lo pidáis).
- [ ] Monitorizar Search Console mensualmente y ajustar títulos con bajo CTR.

---

## 7. Plantillas rápidas (meta etiquetas)

Ajustad el texto a vuestro tono de marca y oferta real.

**Home — ejemplo title:**  
`GiBravo Travel | Agenzia viaggi a Milano - Viaggi organizzati in bus e aereo`

**Home — ejemplo description:**  
`Viaggi organizzati da Milano in pullman e aereo: destinazioni in Italia e Europa. Scopri le partenze e i tour GiBravo Travel.`

**Partenze — ejemplo title:**  
`Partenze viaggi organizzati | GiBravo Travel Milano`

**Chi siamo — ejemplo title:**  
`Chi siamo | GiBravo Travel - Agenzia viaggi Milano`

---

## 8. Herramientas de referencia

- [Google Search Console](https://search.google.com/search-console) — impresiones, consultas, indexación.  
- [Google Business Profile](https://business.google.com) — local.  
- PageSpeed Insights / Lighthouse — rendimiento.

---

## 9. Changelog del documento

| Fecha | Cambio |
|-------|--------|
| 2026-05-07 | Creación del plan inicial de referencia. |
| 2026-05-07 | § 5.1 Rendimiento/PageSpeed (baseline móvil, hallazgos, cambios en repo); Fase 0 rendimiento. |
| 2026-05-07 | Eliminado GoHighLevel/LeadConnector: formulario contatti + Resend; pie con CTA a módulo y email. |
| 2026-05-08 | Metadata dinámico `/tour/[slug]` (`lib/seo/tour-metadata.ts`): canonical, OG, keywords, noindex si no público. |
