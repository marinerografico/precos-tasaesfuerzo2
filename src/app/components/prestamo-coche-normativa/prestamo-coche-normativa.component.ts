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
import { NormativaVariant } from '../../constants/normativa-disponibles';

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
  @Output() adjustSimulation = new EventEmitter<void>();

  screen: NormativaScreen = 'question';
  paysElsewhereAnswer: NormativaAnswer = null;
  calculatorReady = false;
  calculatorApto = false;

  private otherProductRedirectTimer: ReturnType<typeof setTimeout> | null = null;
  private removeDocumentClickListener: (() => void) | null = null;
  private bodyOverlayElement: HTMLElement | null = null;
  private componentOverlayElement: HTMLElement | null = null;
  private savedComponentOverlayDisplay: string | null = null;

  constructor(
    private viewportScroller: ViewportScroller,
    private host: ElementRef,
    private renderer: Renderer2
  ) {}

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
    this.removeBodyOverlay();
    if (this.removeDocumentClickListener) {
      this.removeDocumentClickListener();
      this.removeDocumentClickListener = null;
    }
  }

  get showCalculator(): boolean {
    return this.paysElsewhereAnswer === 'yes';
  }

  get canContinue(): boolean {
    if (this.screen !== 'question' || this.paysElsewhereAnswer === null) {
      return false;
    }
    if (this.paysElsewhereAnswer === 'no') {
      return true;
    }
    return this.calculatorReady;
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
      this.calculatorReady = false;
      this.calculatorApto = false;
    }
    setTimeout(() => {
      this.initIcons();
      if (answer === 'yes') {
        this.scrollToCalculator();
      }
    }, 0);
  }

  onCalculatorResultChange(result: { ready: boolean; apto: boolean }): void {
    this.calculatorReady = result.ready;
    this.calculatorApto = result.apto;
  }

  onContinuar(): void {
    if (this.paysElsewhereAnswer === 'no') {
      this.accepted.emit();
      return;
    }
    if (this.paysElsewhereAnswer === 'yes' && this.calculatorReady) {
      if (this.calculatorApto) {
        this.accepted.emit();
      } else {
        this.showUnavailableScreen();
      }
    }
  }

  onViewOtherLoansFromUnavailable(): void {
    if (this.otherProductRedirectTimer) {
      clearTimeout(this.otherProductRedirectTimer);
    }

    this.screen = 'redirect-spinner';
    this.createBodyOverlay();

    this.otherProductRedirectTimer = setTimeout(() => {
      this.otherProductRedirectTimer = null;
      this.removeBodyOverlay();
      this.viewOtherLoans.emit();
    }, 2800);
  }

  onGoToPosicionGlobalFromUnavailable(): void {
    this.goToPosicionGlobal.emit();
  }

  /** Tras volver de simulación, el padre invoca esto vía ViewChild */
  applyAutoOpenCalculator(): void {
    this.paysElsewhereAnswer = 'yes';
    this.calculatorReady = false;
    this.calculatorApto = false;
    setTimeout(() => {
      this.initIcons();
      this.scrollToCalculator();
    }, 0);
  }

  private showUnavailableScreen(): void {
    markPreconcedidoNormativaRechazado();
    this.screen = 'unavailable';
    this.rejected.emit();
    this.scrollToTop();
    this.initIcons();
  }

  private scrollToCalculator(): void {
    const block = this.host.nativeElement.querySelector('.normativa-calc-embed') as HTMLElement | null;
    block?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private scrollToTop(): void {
    const main = this.host.nativeElement.querySelector('.normativa-main') as HTMLElement | null;
    if (main) {
      main.scrollTop = 0;
    }
    this.viewportScroller.scrollToPosition([0, 0]);
    setTimeout(() => {
      if (main) {
        main.scrollTop = 0;
      }
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

  private createBodyOverlay(): void {
    if (this.bodyOverlayElement) {
      return;
    }

    try {
      const compOverlay = this.host.nativeElement.querySelector('.other-product-redirect-overlay');
      if (compOverlay) {
        this.componentOverlayElement = compOverlay as HTMLElement;
        this.savedComponentOverlayDisplay = this.componentOverlayElement.style.display || null;
        this.componentOverlayElement.style.display = 'none';
      }

      const overlay = this.renderer.createElement('div') as HTMLElement;
      this.renderer.addClass(overlay, 'other-product-redirect-overlay');
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
      const textNode = this.renderer.createText(
        'Te llevamos al proceso de solicitud para que puedas ver si el banco te lo aprueba.'
      );
      this.renderer.appendChild(text, textNode);

      this.renderer.appendChild(content, spinner);
      this.renderer.appendChild(content, title);
      this.renderer.appendChild(content, text);
      this.renderer.appendChild(overlay, content);

      this.renderer.appendChild(document.body, overlay);
      this.bodyOverlayElement = overlay;
    } catch (e) {
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
