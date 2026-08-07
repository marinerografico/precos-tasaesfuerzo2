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
  @Output() openCalculator = new EventEmitter<void>();

  screen: NormativaScreen = 'question';
  paysElsewhereAnswer: NormativaAnswer = null;
  secondAnswer: NormativaAnswer = null;

  // Tooltip state for the example
  showExampleTooltip = false;

  // handler remover for document click listener (to close tooltip when clicking outside)
  private removeDocumentClickListener: (() => void) | null = null;

  private otherProductRedirectTimer: ReturnType<typeof setTimeout> | null = null;

  // overlay appended to body (if used)
  private bodyOverlayElement: HTMLElement | null = null;
  // component's in-template overlay element (if present) and its previous display value
  private componentOverlayElement: HTMLElement | null = null;
  private savedComponentOverlayDisplay: string | null = null;

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
    // ensure body overlay removed if still present
    this.removeBodyOverlay();
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

  onOpenCalculator(): void {
    this.openCalculator.emit();
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

    // create a body-level overlay so it's not affected by component stacking contexts
    this.createBodyOverlay();

    this.otherProductRedirectTimer = setTimeout(() => {
      this.otherProductRedirectTimer = null;
      // ensure we remove the body overlay before emitting navigation event
      this.removeBodyOverlay();
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

  /**
   * Create an overlay element appended to document.body so it's not affected
   * by ancestor stacking contexts (transforms) or scoped component styles.
   */
  private createBodyOverlay(): void {
    // if already created, ensure it's visible
    if (this.bodyOverlayElement) { return; }

    try {
      // hide in-template overlay if present to avoid duplicate visuals
      const compOverlay = this.host.nativeElement.querySelector('.other-product-redirect-overlay');
      if (compOverlay) {
        this.componentOverlayElement = compOverlay as HTMLElement;
        this.savedComponentOverlayDisplay = this.componentOverlayElement.style.display || null;
        this.componentOverlayElement.style.display = 'none';
      }

      const overlay = this.renderer.createElement('div') as HTMLElement;
      this.renderer.addClass(overlay, 'other-product-redirect-overlay');
      // accessibility
      this.renderer.setAttribute(overlay, 'role', 'status');
      this.renderer.setAttribute(overlay, 'aria-live', 'polite');
      this.renderer.setAttribute(overlay, 'aria-busy', 'true');

      const content = this.renderer.createElement('div');
      this.renderer.addClass(content, 'other-product-redirect-content');

      const spinner = this.renderer.createElement('div');
      this.renderer.addClass(spinner, 'other-product-redirect-spinner');
      this.renderer.setAttribute(spinner, 'aria-hidden', 'true');

      const title = this.renderer.createElement('h2');
      this.renderer.addClass(title, 'other-product-redirect-title');
      const titleText = this.renderer.createText('Preparando Préstamo Sabadell');
      this.renderer.appendChild(title, titleText);

      const text = this.renderer.createElement('p');
      this.renderer.addClass(text, 'other-product-redirect-text');
      const textNode = this.renderer.createText('Te llevamos al proceso de solicitud para que puedas ver si el banco te lo aprueba.');
      this.renderer.appendChild(text, textNode);

      this.renderer.appendChild(content, spinner);
      this.renderer.appendChild(content, title);
      this.renderer.appendChild(content, text);
      this.renderer.appendChild(overlay, content);

      this.renderer.appendChild(document.body, overlay);
      this.bodyOverlayElement = overlay;
    } catch (e) {
      // fallback: ignore if DOM manipulation not allowed
      // (shouldn't happen in browser runtime)
      console.error('createBodyOverlay failed', e);
    }
  }

  private removeBodyOverlay(): void {
    if (this.bodyOverlayElement) {
      try {
        if (this.bodyOverlayElement.parentNode) {
          this.bodyOverlayElement.parentNode.removeChild(this.bodyOverlayElement);
        }
      } catch (e) {
        // ignore
      }
      this.bodyOverlayElement = null;
    }

    // restore component-scoped overlay visibility if we hid it
    if (this.componentOverlayElement) {
      try {
        if (this.savedComponentOverlayDisplay !== null) {
          this.componentOverlayElement.style.display = this.savedComponentOverlayDisplay;
        } else {
          this.componentOverlayElement.style.display = '';
        }
      } catch (e) {
        // ignore
      }
      this.componentOverlayElement = null;
      this.savedComponentOverlayDisplay = null;
    }
  }
}
