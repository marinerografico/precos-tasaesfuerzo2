import { Component, EventEmitter, Output, AfterViewInit, Input, OnInit, OnDestroy } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { PRESTAMO_FAQS, SEGURO_FAQS } from '../../constants/prestamo-coche-faq';
declare var lucide: any;

export interface PrestamoCocheResumenData {
  amount: number;
  termMonths: number;
  monthlyPayment: number;
  tin: number;
  tae: number;
  openingCommission: number;
  totalInterest: number;
  totalToRepay: number;
  firstPaymentDate: string;
  hasInsurance: boolean;
  /** Indica si el cliente ha declarado alguna condición médica (no se puede añadir el seguro). */
  medicalConditionDeclared?: boolean;
  insuranceAnnualPremium?: number;
  insuranceFirstReceipt?: number;
  insuranceMonthlyReceipt?: number;
  accountNumber?: string;
  accountHolder?: string;
  loanPurpose?: string;
}

@Component({
  selector: 'app-prestamo-coche-resumen',
  templateUrl: './prestamo-coche-resumen.component.html',
  styleUrls: ['./prestamo-coche-resumen.component.scss']
})
export class PrestamoCocheResumenComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() loanData?: PrestamoCocheResumenData;
  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() closeRequested = new EventEmitter<void>();

  constructor(private viewportScroller: ViewportScroller) {}

  // Toast de éxito
  showSuccessToast = false;
  private toastTimeout: any;
  // Toast informativo cuando no se puede añadir el seguro por condición médica
  showMedicalToast = false;

  // Dropdown de cuentas
  showAccountDropdown = false;
  selectedInsuranceAccount = 'Cuenta Online Sabadell •••2930';
  availableAccounts = [
    'Cuenta Online Sabadell •••2930',
    'Cuenta Nómina Sabadell •••4852',
    'Cuenta Ahorro Sabadell •••7123'
  ];

  // Dropdown de beneficiarios
  showBeneficiaryDropdown = false;
  selectedBeneficiary = 'Herederos legales';
  availableBeneficiaries = [
    'Herederos legales',
    'Banco y restante herederos legales',
    'Banco y restante cónyuge',
    'Banco y restante hijos',
    'Cónyuge',
    'Hijos'
  ];

  // Dropdown de motivo del préstamo
  showLoanPurposeDropdown = false;
  loanPurposeOptions: string[] = [
    'Vehículo',
    'Imprevisto familiar',
    'Viajes',
    'Salud',
    'Muebles y electrodomésticos',
    'Celebración',
    'Impuestos',
    'Reparaciones de vehículo',
    'Estudios'
  ];

  // Visor de documentos
  showDocumentViewer = false;
  documentZoom = 100;


  // Modal FAQs
  showFaqModal = false;
  faqActiveTab: 'prestamo' | 'seguro' = 'prestamo';
  expandedPrestamoId: number | null = null;
  expandedSeguroId: number | null = null;
  prestamoFaqs = PRESTAMO_FAQS;
  seguroFaqs = SEGURO_FAQS;

  // Datos por defecto (solo si no llega loanData desde la simulación)
  defaultData: PrestamoCocheResumenData = {
    amount: 31000,
    termMonths: 96,
    monthlyPayment: 0,
    tin: 4.00,
    tae: 4.84,
    openingCommission: 0,
    totalInterest: 0,
    totalToRepay: 0,
    firstPaymentDate: '',
    hasInsurance: false,
    medicalConditionDeclared: false,
    accountNumber: 'Cuenta Online Sabadell •••2930',
    accountHolder: 'María García Palao'
  };

  /** Datos visibles: siempre los de la simulación (loanData) si existen. */
  get data(): PrestamoCocheResumenData {
    return this.loanData || this.defaultData;
  }

  ngOnInit(): void {
    if (this.data.hasInsurance) {
      setTimeout(() => this.showSuccessToastNotification(), 500);
    } else if (this.loanData?.medicalConditionDeclared) {
      setTimeout(() => this.showMedicalRestrictionToast(), 500);
    }
  }

  ngAfterViewInit(): void {
    this.scrollToTop();
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 100);
    }
    document.addEventListener('click', this.closeDropdowns.bind(this));
  }

  /** Reset del scroll al aterrizar en la página de resumen. */
  private scrollToTop(): void {
    this.viewportScroller.scrollToPosition([0, 0]);
    setTimeout(() => {
      window.scrollTo(0, 0);
      const scrollable = document.querySelector('.wizard-content') || document.documentElement;
      if (scrollable && 'scrollTop' in scrollable) {
        (scrollable as HTMLElement).scrollTop = 0;
      }
    }, 0);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.closeDropdowns.bind(this));
  }

  private closeDropdowns(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.resumen-item-dropdown')) {
      this.showAccountDropdown = false;
      this.showBeneficiaryDropdown = false;
      this.showLoanPurposeDropdown = false;
    }
  }

  onBack(): void {
    this.back.emit();
  }

  onCloseRequest(): void {
    this.closeRequested.emit();
  }

  onModifyRequest(): void {
    // Volver a la simulación
    this.back.emit();
  }

  toggleAccountDropdown(): void {
    this.showAccountDropdown = !this.showAccountDropdown;
    this.showBeneficiaryDropdown = false;
    this.showLoanPurposeDropdown = false;
  }

  selectAccount(account: string): void {
    this.selectedInsuranceAccount = account;
    this.showAccountDropdown = false;
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  toggleBeneficiaryDropdown(): void {
    this.showBeneficiaryDropdown = !this.showBeneficiaryDropdown;
    this.showAccountDropdown = false;
    this.showLoanPurposeDropdown = false;
  }

  selectBeneficiary(beneficiary: string): void {
    this.selectedBeneficiary = beneficiary;
    this.showBeneficiaryDropdown = false;
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  toggleLoanPurposeDropdown(): void {
    this.showLoanPurposeDropdown = !this.showLoanPurposeDropdown;
    this.showAccountDropdown = false;
    this.showBeneficiaryDropdown = false;
  }

  selectLoanPurpose(purpose: string): void {
    this.showLoanPurposeDropdown = false;
    // Guardar el motivo en los datos del préstamo para que llegue a confirmación
    if (this.loanData) {
      this.loanData.loanPurpose = purpose;
    } else {
      this.defaultData.loanPurpose = purpose;
    }
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  openDocumentViewer(): void {
    this.showDocumentViewer = true;
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  closeDocumentViewer(): void {
    this.showDocumentViewer = false;
    document.body.style.overflow = '';
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
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
    this.onCloseFaq();
  }

  zoomIn(): void {
    if (this.documentZoom < 200) {
      this.documentZoom += 25;
    }
  }

  zoomOut(): void {
    if (this.documentZoom > 50) {
      this.documentZoom -= 25;
    }
  }

  downloadDocument(): void {
    // Simular descarga
    console.log('Descargando documentación precontractual del seguro...');
    // En producción, aquí se descargaría el PDF real
    alert('Descarga iniciada. En producción, se descargaría el PDF de la documentación precontractual.');
  }

  shareDocument(): void {
    // Simular compartir
    console.log('Compartiendo documentación...');
    if (navigator.share) {
      navigator.share({
        title: 'Documentación Precontractual - Seguro Protección Vida capital constante',
        text: 'Documentación precontractual del seguro de protección de vida',
        url: window.location.href
      }).catch(err => console.log('Error al compartir:', err));
    } else {
      alert('Función de compartir no disponible en este navegador.');
    }
  }

  onContinue(): void {
    this.next.emit();
  }

  showSuccessToastNotification(): void {
    this.showSuccessToast = true;
    this.showMedicalToast = false;
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 0);
    }
    // Cerrar automáticamente después de 5 segundos
    this.toastTimeout = setTimeout(() => {
      this.closeToast();
    }, 5000);
  }

  closeToast(): void {
    this.showSuccessToast = false;
    this.showMedicalToast = false;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  private showMedicalRestrictionToast(): void {
    this.showMedicalToast = true;
    this.showSuccessToast = false;
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 0);
    }
    this.toastTimeout = setTimeout(() => {
      this.closeToast();
    }, 5000);
  }

  get formattedAmount(): string {
    return this.data.amount.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  get formattedMonthlyPayment(): string {
    return this.data.monthlyPayment.toFixed(2).replace('.', ',');
  }

  get formattedTotalInterest(): string {
    return this.data.totalInterest.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  get formattedOpeningCommission(): string {
    return this.data.openingCommission.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  get formattedTotalToRepay(): string {
    return this.data.totalToRepay.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  get tinFormatted(): string {
    return this.data.tin.toFixed(2).replace('.', ',');
  }

  get taeFormatted(): string {
    return this.data.tae.toFixed(2).replace('.', ',');
  }

  get termYears(): number {
    // Mapeo según lo mostrado en la simulación: 96→8, 70→7, 50→5, 30→3
    const monthToYearMap: { [key: number]: number } = {
      96: 8,
      70: 7,
      50: 5,
      30: 3
    };
    
    // Si está en el mapeo, usar ese valor; si no, calcular redondeando
    return monthToYearMap[this.data.termMonths] ?? Math.round(this.data.termMonths / 12);
  }

  get formattedInsuranceAnnualPremium(): string {
    if (!this.data.insuranceAnnualPremium) return '0,00';
    return this.data.insuranceAnnualPremium.toFixed(2).replace('.', ',');
  }

  get formattedInsuranceFirstReceipt(): string {
    if (!this.data.insuranceFirstReceipt) return '0,00';
    return this.data.insuranceFirstReceipt.toFixed(2).replace('.', ',');
  }

  get formattedInsuranceMonthlyReceipt(): string {
    if (!this.data.insuranceMonthlyReceipt) return '0,00';
    return this.data.insuranceMonthlyReceipt.toFixed(2).replace('.', ',');
  }
}
