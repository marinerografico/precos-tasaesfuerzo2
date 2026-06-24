import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  AfterViewInit,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { markPreconcedidoNormativaRechazado } from '../../constants/prestamo-preconcedido-entry';
import {
  NormativaVariant,
  NormativaEjemploTooltip,
  NORMATIVA_INGRESOS_DEFAULT,
  buildNormativaEjemploTooltip,
  calcularDisponiblesNormativa,
  formatNormativaEuro
} from '../../constants/normativa-disponibles';

declare var lucide: any;

type NormativaAnswer = 'yes' | 'no' | null;
type NormativaScreen = 'question' | 'unavailable' | 'redirect-spinner';

@Component({
  selector: 'app-prestamo-coche-normativa',
  templateUrl: './prestamo-coche-normativa.component.html',
  styleUrls: ['./prestamo-coche-normativa.component.scss']
})
export class PrestamoCocheNormativaComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() variant: NormativaVariant = 'classic';
  @Input() ingresosMensuales = NORMATIVA_INGRESOS_DEFAULT;
  @Input() cuotaMensual = 0;
  @Input() initialScreen: NormativaScreen = 'question';
  @Output() back = new EventEmitter<void>();
  @Output() accepted = new EventEmitter<void>();
  @Output() rejected = new EventEmitter<void>();
  @Output() closeRequested = new EventEmitter<void>();
  @Output() viewOtherLoans = new EventEmitter<void>();
  @Output() goToPosicionGlobal = new EventEmitter<void>();

  screen: NormativaScreen = 'question';
  paysElsewhereAnswer: NormativaAnswer = null;
  secondAnswer: NormativaAnswer = null;
  showEjemploTooltip = false;

  private otherProductRedirectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private viewportScroller: ViewportScroller) {}

  get isTangibleVariant(): boolean {
    return this.variant === 'tangible';
  }

  get ingresosEfectivos(): number {
    return this.ingresosMensuales > 0 ? this.ingresosMensuales : NORMATIVA_INGRESOS_DEFAULT;
  }

  get disponiblesEuros(): number {
    return calcularDisponiblesNormativa(this.ingresosEfectivos, this.cuotaMensual);
  }

  get ingresosLabel(): string {
    return formatNormativaEuro(this.ingresosEfectivos);
  }

  get cuotaMensualLabel(): string {
    return formatNormativaEuro(this.cuotaMensual);
  }

  get disponiblesLabel(): string {
    return formatNormativaEuro(this.disponiblesEuros);
  }

  get ejemploTooltip(): NormativaEjemploTooltip {
    return buildNormativaEjemploTooltip(this.ingresosEfectivos, this.cuotaMensual);
  }

  ngOnInit(): void {
    if (this.initialScreen !== 'question') {
      this.screen = this.initialScreen;
      if (this.initialScreen === 'unavailable') {
        markPreconcedidoNormativaRechazado();
      }
    }
    this.scrollToTop();
  }

  ngAfterViewInit(): void {
    this.initIcons();
  }

  ngOnDestroy(): void {
    if (this.otherProductRedirectTimer) {
      clearTimeout(this.otherProductRedirectTimer);
      this.otherProductRedirectTimer = null;
    }
  }

  get showSecondQuestion(): boolean {
    return this.paysElsewhereAnswer === 'yes';
  }

  get canContinue(): boolean {
    if (this.screen !== 'question' || this.paysElsewhereAnswer === null) {
      return false;
    }
    if (this.paysElsewhereAnswer === 'no') {
      return true;
    }
    return this.secondAnswer !== null;
  }

  toggleEjemploTooltip(event: Event): void {
    event.stopPropagation();
    this.showEjemploTooltip = !this.showEjemploTooltip;
    if (this.showEjemploTooltip) {
      setTimeout(() => this.initIcons(), 0);
    }
  }

  closeEjemploTooltip(): void {
    this.showEjemploTooltip = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (
      target.closest('.normativa-tooltip-trigger') ||
      target.closest('.normativa-tooltip-panel')
    ) {
      return;
    }
    this.showEjemploTooltip = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.showEjemploTooltip = false;
  }

  onBack(): void {
    this.back.emit();
  }

  onCloseRequest(): void {
    this.closeRequested.emit();
  }

  selectPaysElsewhere(answer: 'yes' | 'no'): void {
    this.paysElsewhereAnswer = answer;
    if (answer === 'no') {
      this.secondAnswer = null;
      this.closeEjemploTooltip();
    }
  }

  selectSecondAnswer(answer: 'yes' | 'no'): void {
    this.secondAnswer = answer;
  }

  onContinuar(): void {
    if (this.paysElsewhereAnswer === 'no') {
      this.accepted.emit();
      return;
    }
    if (this.secondAnswer === 'yes') {
      this.accepted.emit();
      return;
    }
    if (this.secondAnswer === 'no') {
      this.showUnavailableScreen();
    }
  }

  private showUnavailableScreen(): void {
    markPreconcedidoNormativaRechazado();
    this.screen = 'unavailable';
    this.rejected.emit();
    this.scrollToTop();
    this.initIcons();
  }

  onViewOtherLoansFromUnavailable(): void {
    if (this.otherProductRedirectTimer) {
      clearTimeout(this.otherProductRedirectTimer);
    }
    this.screen = 'redirect-spinner';
    this.otherProductRedirectTimer = setTimeout(() => {
      this.otherProductRedirectTimer = null;
      this.viewOtherLoans.emit();
    }, 2800);
  }

  onGoToPosicionGlobalFromUnavailable(): void {
    this.goToPosicionGlobal.emit();
  }

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

  private initIcons(): void {
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 100);
    }
  }
}
