import { Component, EventEmitter, OnInit, Output, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WizardStateService, FinancialProfile } from '../../services/wizard-state.service';
import { Observable } from 'rxjs';
import { WizardState } from '../../services/wizard-state.service';

declare var lucide: any;

@Component({
  selector: 'app-perfil-financiero',
  templateUrl: './perfil-financiero.component.html',
  styleUrls: ['./perfil-financiero.component.scss']
})
export class PerfilFinancieroComponent implements OnInit, AfterViewInit {
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();
  
  state$: Observable<WizardState>;
  profileForm: FormGroup;
  showOtrosBancos = false;

  constructor(
    private wizardState: WizardStateService,
    private fb: FormBuilder
  ) {
    this.state$ = this.wizardState.state$;
    this.profileForm = this.fb.group({
      ingresos: [0, [Validators.required, Validators.min(0)]],
      gastos: [0, [Validators.required, Validators.min(0)]],
      otrosBancos: [false],
      // Campos añadidos para la nueva pregunta (no se guardan en el estado global por ahora)
      otrosPrestamos: [null],
      debtRatio: ['']
    });
  }

  ngOnInit(): void {
    this.state$.subscribe(state => {
      if (state.perfilFinanciero) {
        this.profileForm.patchValue({
          ingresos: state.perfilFinanciero.ingresos,
          gastos: state.perfilFinanciero.gastos,
          otrosBancos: state.perfilFinanciero.otrosBancos
        });
      }
    });

    this.profileForm.valueChanges.subscribe(values => {
      this.updateProfile();
    });
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      const values = this.profileForm.value;
      const currentState = this.wizardState.getCurrentState();
      
      this.wizardState.updateProfile({
        ingresos: values.ingresos || 0,
        gastos: values.gastos || 0,
        otrosBancos: values.otrosBancos || false,
        productos: currentState.perfilFinanciero?.productos || []
      });
    }
  }

  toggleOtrosBancos(): void {
    const currentValue = this.profileForm.get('otrosBancos')?.value;
    this.profileForm.patchValue({ otrosBancos: !currentValue });
    this.showOtrosBancos = !this.showOtrosBancos;
  }

  onContinuar(): void {
    if (this.profileForm.valid) {
      this.updateProfile();
      this.next.emit();
    }
  }

  onVolver(): void {
    this.previous.emit();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  get productos(): any[] {
    const state = this.wizardState.getCurrentState();
    return state.perfilFinanciero?.productos || [];
  }

  ngAfterViewInit(): void {
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }
  }
}
