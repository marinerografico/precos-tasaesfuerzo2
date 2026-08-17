import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ElementRef
} from '@angular/core';
import { formatNormativaEuro } from '../../constants/normativa-disponibles';

declare var lucide: any;

interface CalculadoraResumen {
  ingresos: number;
  otrasCuotas: number;
  cuotaSolicitar: number;
  totalCuotas: number;
  limite: number;
  pctIngresos: number;
  ratioBar: number;
  exceso: number;
  apto: boolean;
}

@Component({
  selector: 'app-prestamo-coche-normativa-calculadora',
  templateUrl: './prestamo-coche-normativa-calculadora.component.html',
  styleUrls: ['./prestamo-coche-normativa-calculadora.component.scss']
})
export class PrestamoCocheNormativaCalculadoraComponent implements OnInit, OnChanges {
  @Input() cuotaMensual = 0;
  @Output() close = new EventEmitter<void>();
  @Output() accepted = new EventEmitter<void>();
  @Output() returnToQuestion = new EventEmitter<void>();

  ingresosRaw = '';
  cuotasExternas: string[] = [''];

  resumen: CalculadoraResumen | null = null;

  constructor(private host: ElementRef) {}

  ngOnInit(): void {
    this.scrollToTop();
    this.recalculate();
    this.initIcons();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cuotaMensual'] && !changes['cuotaMensual'].firstChange) {
      this.recalculate();
    }
  }

  get cuotaSolicitarLabel(): string {
    return `${formatNormativaEuro(this.cuotaMensual, { decimals: 2 })} €`;
  }

  get canContinue(): boolean {
    return this.resumen !== null;
  }

  get continueLabel(): string {
    if (!this.resumen) {
      return 'Continuar';
    }
    return this.resumen.apto ? 'Continuar' : 'Volver a la pregunta';
  }

  formatEuro(value: number, decimals = 0): string {
    return `${formatNormativaEuro(value, { decimals })} €`;
  }

  onIngresosChange(value: string): void {
    this.ingresosRaw = value;
    this.recalculate();
  }

  clearIngresos(): void {
    this.ingresosRaw = '';
    this.recalculate();
  }

  onCuotaExternaChange(index: number, value: string): void {
    this.cuotasExternas[index] = value;
    this.recalculate();
  }

  clearCuotaExterna(index: number): void {
    if (index === 0) {
      this.cuotasExternas[0] = '';
    } else {
      this.cuotasExternas.splice(index, 1);
    }
    this.recalculate();
  }

  addCuotaExterna(): void {
    this.cuotasExternas = [...this.cuotasExternas, ''];
  }

  trackByIndex(index: number): number {
    return index;
  }

  onClose(): void {
    this.close.emit();
  }

  onContinue(): void {
    if (!this.resumen) {
      return;
    }
    if (this.resumen.apto) {
      this.accepted.emit();
      return;
    }
    this.returnToQuestion.emit();
  }

  private recalculate(): void {
    const ingresos = this.parseEuro(this.ingresosRaw);
    const hasAnyCuota = this.cuotasExternas.some((raw) => String(raw).trim() !== '');

    if (ingresos === null || !hasAnyCuota) {
      this.resumen = null;
      return;
    }

    const otrasCuotas = this.cuotasExternas
      .map((raw) => this.parseEuro(raw))
      .filter((n): n is number => n !== null)
      .reduce((sum, n) => sum + n, 0);

    const cuotaSolicitar = Math.max(0, this.cuotaMensual);
    const totalCuotas = otrasCuotas + cuotaSolicitar;
    const limite = ingresos * 0.4;
    const apto = totalCuotas < limite;
    const pctIngresos = ingresos > 0 ? Math.round((totalCuotas / ingresos) * 100) : 0;
    const ratioBar = limite > 0 ? Math.min(100, (totalCuotas / limite) * 100) : 100;

    this.resumen = {
      ingresos,
      otrasCuotas,
      cuotaSolicitar,
      totalCuotas,
      limite,
      pctIngresos,
      ratioBar,
      exceso: Math.max(0, totalCuotas - limite),
      apto
    };
  }

  private parseEuro(raw: string): number | null {
    if (!raw || !String(raw).trim()) {
      return null;
    }
    const n = Number(
      String(raw)
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^\d.]/g, '')
    );
    return Number.isFinite(n) ? n : null;
  }

  private scrollToTop(): void {
    const main = this.host.nativeElement.querySelector('.normativa-calc-main') as HTMLElement | null;
    if (main) {
      main.scrollTop = 0;
    }
  }

  private initIcons(): void {
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 100);
    }
  }
}
