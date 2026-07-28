# MoneyConfidence - MVP

MVP web embebido dentro de la app bancaria de Banco Sabadell desarrollada en Angular. Este módulo permite a los usuarios conocer su perfil en MoneyConfidence mediante un wizard de 5-6 pantallas.

## 🎯 Características

- **5-6 Pantallas tipo wizard** con navegación paso a paso
- **Integración con Galatea Design System** de Banco Sabadell
- **Responsive y mobile-first**
- **Accesible** (WCAG 2.1)
- **Compatible con Angular** (embebido como módulo)

## 📱 Pantallas

1. **Landing**: Muestra la capacidad financiera inicial con scoring
2. **Perfil Financiero**: Ingresos, gastos y productos activos
3. **Capacidad de Financiación**: Cálculo con medidor tipo termómetro
4. **Recomendaciones de Productos**: Listado de productos recomendados
5. **Establecer Meta**: Sugerencia de objetivo si la financiación es insuficiente
6. **Resumen** (opcional): Recap con capacidad, productos y acciones

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm start

# Build para producción
npm run build
```

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── wizard/              # Componente principal del wizard
│   │   ├── landing/             # Pantalla 1: Landing
│   │   ├── perfil-financiero/   # Pantalla 2: Perfil financiero
│   │   ├── capacidad-financiacion/  # Pantalla 3: Capacidad
│   │   ├── recomendaciones-productos/  # Pantalla 4: Productos
│   │   ├── establecer-meta/     # Pantalla 5: Meta
│   │   └── resumen/             # Pantalla 6: Resumen
│   ├── services/
│   │   └── wizard-state.service.ts  # Servicio de estado
│   ├── app.module.ts
│   │   └── app.component.ts
├── styles.scss                   # Estilos globales
└── index.html
```

## 🎨 Sistema de Diseño

El proyecto utiliza el sistema de diseño **Galatea** de Banco Sabadell:

- Design Tokens v12
- Proteo Theme
- BS Fonts
- Componentes Galatea Gamma v2

Los estilos se cargan desde CDN en `index.html`.

## 📦 Integración en App Angular Principal

Para integrar este módulo en la app principal de Angular:

1. Copiar el módulo `MoneyConfidenceModule` (si se crea como módulo independiente)
2. Importar en el módulo principal
3. Usar el selector `<app-wizard></app-wizard>` donde se necesite

## 🔧 Tecnologías

- Angular 17+
- TypeScript 5.2+
- SCSS
- RxJS
- Galatea Design System

## 📝 Notas de Desarrollo

- El servicio `WizardStateService` maneja el estado global del wizard
- Los datos son simulados por defecto
- Las acciones de "Simular" y "Saber más" están preparadas para integración con APIs reales
- El cálculo de capacidad es una simulación básica (ajustar según lógica de negocio)

## 🐛 Próximos Pasos

- [ ] Integrar con APIs reales del banco
- [ ] Conectar con simulador de productos
- [ ] Implementar persistencia de datos
- [ ] Añadir tests unitarios
- [ ] Optimizar para PWA

## 📄 Licencia

Propiedad de Banco Sabadell - Uso interno

---

Redeploy trigger: 2026-07-28T11:30:00Z
