import { ChangeDetectorRef, Component, EventEmitter, Input, Output, AfterViewInit } from '@angular/core';
import { PRESTAMO_FAQS, SEGURO_FAQS } from '../../constants/prestamo-coche-faq';
import {
  formatPreconcedidoImporte,
  PRECONCEDIDO_IMPORTE_MAX
} from '../../constants/prestamo-preconcedido-offer';

declare var lucide: any;

@Component({
  selector: 'app-prestamo-coche-onboarding',
  templateUrl: './prestamo-coche-onboarding.component.html',
  styleUrls: ['./prestamo-coche-onboarding.component.scss']
})
export class PrestamoCocheOnboardingComponent implements AfterViewInit {
  constructor(private cdr: ChangeDetectorRef) {}

  @Input() importeMax = PRECONCEDIDO_IMPORTE_MAX;
  @Output() startSimulation = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() closeRequested = new EventEmitter<void>();

  showFaqModal = false;
  faqActiveTab: 'prestamo' | 'seguro' = 'prestamo';
  expandedPrestamoId: number | null = null;
  expandedSeguroId: number | null = null;
  prestamoFaqs = PRESTAMO_FAQS;
  seguroFaqs = SEGURO_FAQS;
  /** Drawer al 75% desde el inicio para ver título + lista + legal sin scroll excesivo */
  drawerExpanded = true;
  /** Acordeón cerrado al abrir para dejar hueco al texto legal */
  howToExpanded = false;

  get importeMaxLabel(): string {
    return formatPreconcedidoImporte(this.importeMax);
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
      this.howToExpanded = true;
      this.cdr.detectChanges();
    }

    // Asegurar que la pantalla del flujo se muestre siempre desde arriba
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
      const wizard = document.querySelector('.wizard-content');
      if (wizard) {
        (wizard as HTMLElement).scrollTop = 0;
      }
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 0);
  }

  onSimularCuota(): void {
    this.startSimulation.emit();
  }

  onClose(): void {
    this.closeRequested.emit();
  }

  expandDrawer(): void {
    if (!this.drawerExpanded) {
      this.drawerExpanded = true;
    }
  }

  toggleHowTo(): void {
    this.howToExpanded = !this.howToExpanded;
    this.expandDrawer();
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 0);
    }
  }

  onBack(): void {
    this.closeRequested.emit();
  }

  onOpenFaq(): void {
    this.showFaqModal = true;
    this.faqActiveTab = 'prestamo';
    this.expandedPrestamoId = null;
    this.expandedSeguroId = null;
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 150);
    }
  }

  onCloseFaq(): void {
    this.showFaqModal = false;
    this.expandedPrestamoId = null;
    this.expandedSeguroId = null;
  }

  setFaqTab(tab: 'prestamo' | 'seguro'): void {
    this.faqActiveTab = tab;
  }

  togglePrestamoFaq(id: number): void {
    this.expandedPrestamoId = this.expandedPrestamoId === id ? null : id;
  }

  toggleSeguroFaq(id: number): void {
    this.expandedSeguroId = this.expandedSeguroId === id ? null : id;
  }

  onFaqHelp(): void {
    // Enlace a ayuda (por ejemplo, teléfono o chat)
    this.onCloseFaq();
  }
}
