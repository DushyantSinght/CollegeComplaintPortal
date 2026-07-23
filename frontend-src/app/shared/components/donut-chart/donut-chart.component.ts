import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartDatum } from '../bar-chart/bar-chart.component';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="donut-chart" *ngIf="total > 0; else noData">
      <div class="donut-svg-wrap">
        <svg viewBox="0 0 42 42" class="donut-svg">
          <circle
            class="donut-ring"
            cx="21"
            cy="21"
            r="15.91549430918954"
            fill="transparent"
            stroke="var(--color-border-light)"
            stroke-width="4"
          ></circle>
          <circle
            *ngFor="let seg of segments"
            cx="21"
            cy="21"
            r="15.91549430918954"
            fill="transparent"
            [attr.stroke]="seg.color"
            stroke-width="4"
            [attr.stroke-dasharray]="seg.dash"
            [attr.stroke-dashoffset]="seg.offset"
          ></circle>
        </svg>
        <div class="donut-center">
          <span class="donut-total">{{ total }}</span>
          <span class="donut-total-label">Total</span>
        </div>
      </div>
      <ul class="donut-legend">
        <li *ngFor="let d of data">
          <span class="legend-swatch" [style.background]="d.color || 'var(--color-accent)'"></span>
          {{ d.label }} — {{ d.value }}
        </li>
      </ul>
    </div>
    <ng-template #noData>
      <p class="muted">No data yet.</p>
    </ng-template>
  `
})
export class DonutChartComponent {
  @Input() data: ChartDatum[] = [];

  get total(): number {
    return this.data.reduce((sum, d) => sum + d.value, 0);
  }

  get segments(): { color: string; dash: string; offset: number }[] {
    const total = this.total || 1;
    let cumulative = 0;
    return this.data
      .filter((d) => d.value > 0)
      .map((d) => {
        const pct = (d.value / total) * 100;
        const dash = `${pct} ${100 - pct}`;
        const offset = 25 - cumulative;
        cumulative += pct;
        return { color: d.color || 'var(--color-accent)', dash, offset };
      });
  }
}
