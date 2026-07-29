import {
  Component,
  EventEmitter,
  Input,
  Output,
  AfterViewInit,
  OnDestroy,
  OnInit,
  ElementRef,
  Renderer2
} from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { markPreconcedidoNormativaRechazado } from '../../constants/prestamo-preconcedido-entry';
import {
  NormativaVariant,
  NORMATIVA_INGRESOS_EJEMPLO,
  buildNormativaEjemploNarrativa,
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

  // Tooltip state for the example
  showExampleTooltip = false;

  // handler remover for document click listener (to close tooltip when clicking outside)
  private removeDocumentClickListener: (() => void) | null = null;

  private otherProductRedirectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private viewportScroller: ViewportScroller,
    private host: ElementRef,
    private renderer: Renderer2
  ) {}

  get isTangibleVariant(): boolean {
    return this.variant === 'tangible';
  }

  get cuotaMensualLabel(): string {
    return formatNormativaEuro(this.cuotaMensual);
  }

  /** X = ingresos de referencia (dosmileurista) − cuota de este préstamo */
  get umbralDisponiblesEuros(): number {
    return calcularDisponiblesNormativa(NORMATIVA_INGRESOS_EJEMPLO, this.cuotaMensual);
  }

  get umbralDisponiblesLabel(): string {
    return formatNormativaEuro(this.umbralDisponiblesEuros);
  }

  get ejemploNarrativa(): string {
    return buildNormativaEjemploNarrativa(this.cuotaMensual);
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
    if (this.removeDocumentClickListener) {
      this.removeDocumentClickListener();
      this.removeDocumentClickListener = null;
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
    } else {
      setTimeout(() => this.initIcons(), 0);
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

  toggleExampleTooltip(event?: Event): void {
    if (event) { event.stopPropagation(); }

    this.showExampleTooltip = !this.showExampleTooltip;

    // attach/remove a document click listener to detect outside clicks
    if (this.showExampleTooltip) {
      // add listener
      if (!this.removeDocumentClickListener) {
        this.removeDocumentClickListener = this.renderer.listen('document', 'click', (evt: Event) => {
          const target = evt.target as Node;
          if (!this.host.nativeElement.contains(target)) {
            this.showExampleTooltip = false;
            if (this.removeDocumentClickListener) {
              this.removeDocumentClickListener();
              this.removeDocumentClickListener = null;
            }
          }
        });
      }
    } else {
      // remove listener if present
      if (this.removeDocumentClickListener) {
        this.removeDocumentClickListener();
        this.removeDocumentClickListener = null;
      }
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
