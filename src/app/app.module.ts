import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppEntryRedirectComponent } from './components/app-entry-redirect/app-entry-redirect.component';
import { WizardComponent } from './components/wizard/wizard.component';
import { PosicionGlobalComponent } from './components/posicion-global/posicion-global.component';
import { ContratarComponent } from './components/contratar/contratar.component';
import { PrestamosComponent } from './components/prestamos/prestamos.component';
import { LandingComponent } from './components/landing/landing.component';
import { PerfilFinancieroComponent } from './components/perfil-financiero/perfil-financiero.component';
import { CapacidadFinanciacionComponent } from './components/capacidad-financiacion/capacidad-financiacion.component';
import { RecomendacionesProductosComponent } from './components/recomendaciones-productos/recomendaciones-productos.component';
import { EstablecerMetaComponent } from './components/establecer-meta/establecer-meta.component';
import { ResumenComponent } from './components/resumen/resumen.component';
import { AmountSliderGalateaComponent } from './components/amount-slider-galatea/amount-slider-galatea.component';
import { PrestamoCocheOnboardingComponent } from './components/prestamo-coche-onboarding/prestamo-coche-onboarding.component';
import { PrestamoCocheSimulacionComponent } from './components/prestamo-coche-simulacion/prestamo-coche-simulacion.component';
import { PrestamoCocheResumenComponent } from './components/prestamo-coche-resumen/prestamo-coche-resumen.component';
import { PrestamoCocheNormativaComponent } from './components/prestamo-coche-normativa/prestamo-coche-normativa.component';
import { PrestamoCocheNormativaCalculadoraComponent } from './components/prestamo-coche-normativa-calculadora/prestamo-coche-normativa-calculadora.component';
import { PrestamoCocheDocumentManagerComponent } from './components/prestamo-coche-document-manager/prestamo-coche-document-manager.component';
import { PrestamoCocheFirmaComponent } from './components/prestamo-coche-firma/prestamo-coche-firma.component';
import { PrestamoCocheSeguroDocumentManagerComponent } from './components/prestamo-coche-seguro-document-manager/prestamo-coche-seguro-document-manager.component';
import { PrestamoCocheLoadingComponent } from './components/prestamo-coche-loading/prestamo-coche-loading.component';
import { PrestamoCocheConfirmacionComponent } from './components/prestamo-coche-confirmacion/prestamo-coche-confirmacion.component';
import { PrestamoSabadellFlowComponent } from './components/prestamo-sabadell-flow/prestamo-sabadell-flow.component';
import { LoginFlowComponent } from './components/login-flow/login-flow.component';
import { ProximosPagosComponent } from './components/proximos-pagos/proximos-pagos.component';
import { GestionarPagosHubComponent } from './components/gestionar-pagos-hub/gestionar-pagos-hub.component';
import { FraccionarComprasFlowComponent } from './components/fraccionar-compras-flow/fraccionar-compras-flow.component';
import { UpcomingPaymentDetailSheetComponent } from './components/upcoming-payment-detail-sheet/upcoming-payment-detail-sheet.component';
import { UpcomingPaymentBrandLogoComponent } from './components/upcoming-payment-brand-logo/upcoming-payment-brand-logo.component';

@NgModule({
  declarations: [
    AppComponent,
    AppEntryRedirectComponent,
    LoginFlowComponent,
    ProximosPagosComponent,
    GestionarPagosHubComponent,
    FraccionarComprasFlowComponent,
    UpcomingPaymentDetailSheetComponent,
    UpcomingPaymentBrandLogoComponent,
    WizardComponent,
    PosicionGlobalComponent,
    ContratarComponent,
    PrestamosComponent,
    LandingComponent,
    PerfilFinancieroComponent,
    CapacidadFinanciacionComponent,
    RecomendacionesProductosComponent,
    EstablecerMetaComponent,
    ResumenComponent,
    AmountSliderGalateaComponent,
    PrestamoCocheOnboardingComponent,
    PrestamoCocheSimulacionComponent,
    PrestamoCocheResumenComponent,
    PrestamoCocheNormativaComponent,
    PrestamoCocheNormativaCalculadoraComponent,
    PrestamoCocheDocumentManagerComponent,
    PrestamoCocheFirmaComponent,
    PrestamoCocheSeguroDocumentManagerComponent,
    PrestamoCocheLoadingComponent,
    PrestamoCocheConfirmacionComponent,
    PrestamoSabadellFlowComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Permite usar Web Components de Galatea
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
