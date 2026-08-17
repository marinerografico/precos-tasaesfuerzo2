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
type SecondQuestionAnswer = 'yes' | 'no' | 'need-help' | null;
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
  secondAnswer: SecondQuestionAnswer = null;
  calculatorSuggestion: NormativaAnswer = null;
  showCalculator = false;
  showExampleTooltip = false;

  private otherProductRedirectTimer: ReturnType<typeof setTimeout> | null = null;
  private removeDocumentClickListener: (() => void) | null = null;
  private bodyOverlayElement: HTMLElement | null = null;
  private componentOverlayElement: HTMLElement | null = null;
  private savedComponentOverlayDisplay: string | null = null;
  private savedBodyOverflow = '';

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
    this.setBodyScrollLocked(false);
    this.removeBodyOverlay();
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
    if (this.secondAnswer === 'need-help') {
      return true;
    }
    return this.secondAnswer === 'yes' || this.secondAnswer === 'no';
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
      this.resetSecondQuestionState();
      this.showCalculator = false;
      this.setBodyScrollLocked(false);
    } else {
      setTimeout(() => this.initIcons(), 0);
    }
  }

  selectSecondAnswer(answer: SecondQuestionAnswer): void {
    this.secondAnswer = answer;
    if (answer === 'yes' || answer === 'no') {
      this.calculatorSuggestion = null;
    }
  }

  openCalculatorOverlay(): void {
    this.showCalculator = true;
    this.setBodyScrollLocked(true);
    setTimeout(() => this.initIcons(), 0);
  }

  onCalculatorClose(): void {
    this.showCalculator = false;
    this.setBodyScrollLocked(false);
  }

  /** Calculadora apta: vuelta a Q2 con sugerencia; el usuario debe confirmar Sí/No */
  onCalculatorAccepted(): void {
    this.showCalculator = false;
    this.setBodyScrollLocked(false);
    this.calculatorSuggestion = 'yes';
    this.secondAnswer = null;
    setTimeout(() => {
      this.initIcons();
      this.scrollToSecondQuestion();
    }, 0);
  }

  /** Calculadora no apta: vuelta a Q2 con sugerencia No; el usuario debe confirmar Sí/No */
  onCalculatorReturnToQuestion(): void {
    this.showCalculator = false;
    this.setBodyScrollLocked(false);
    this.calculatorSuggestion = 'no';
    this.secondAnswer = null;
    setTimeout(() => {
      this.initIcons();
      this.scrollToSecondQuestion();
    }, 0);
  }

  onContinuar(): void {
    if (this.paysElsewhereAnswer === 'no') {
      this.accepted.emit();
      return;
    }
    if (this.secondAnswer === 'need-help') {
      this.openCalculatorOverlay();
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
    if (event) {
      event.stopPropagation();
    }

    this.showExampleTooltip = !this.showExampleTooltip;

    if (this.showExampleTooltip) {
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
    } else if (this.removeDocumentClickListener) {
      this.removeDocumentClickListener();
      this.removeDocumentClickListener = null;
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
    this.secondAnswer = 'need-help';
    this.calculatorSuggestion = null;
    this.openCalculatorOverlay();
  }

  private resetSecondQuestionState(): void {
    this.secondAnswer = null;
    this.calculatorSuggestion = null;
  }

  private showUnavailableScreen(): void {
    markPreconcedidoNormativaRechazado();
    this.screen = 'unavailable';
    this.rejected.emit();
    this.scrollToTop();
    this.initIcons();
  }

  private scrollToSecondQuestion(): void {
    const block = this.host.nativeElement.querySelector('#normativa-q2') as HTMLElement | null;
    block?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private setBodyScrollLocked(locked: boolean): void {
    if (locked) {
      this.savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return;
    }
    document.body.style.overflow = this.savedBodyOverflow;
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
