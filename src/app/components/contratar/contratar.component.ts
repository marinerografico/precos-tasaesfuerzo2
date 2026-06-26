import { Component, EventEmitter, Output, AfterViewInit, OnInit } from '@angular/core';
import { WizardStateService } from '../../services/wizard-state.service';

declare var lucide: any;

@Component({
  selector: 'app-contratar',
  templateUrl: './contratar.component.html',
  styleUrls: ['./contratar.component.scss']
})
export class ContratarComponent implements AfterViewInit, OnInit {
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();

  constructor(private wizardState: WizardStateService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }

  /** Listado «Préstamos y créditos» en Contratar: abre el hub de préstamos. */
  onIrAPrestamos(): void {
    this.wizardState.setCurrentStep(3);
  }

  /** Tarjeta genérica cashback */
  onCashbackPromoClick(): void {
    // Punto de extensión: detalle del programa cashback
  }

  onVolver(): void {
    this.previous.emit();
  }
}
