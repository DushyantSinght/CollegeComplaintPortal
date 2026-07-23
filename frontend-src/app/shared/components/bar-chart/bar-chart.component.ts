import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bar-chart" *ngIf="data?.length; else noData">
      <div class="bar-row" *ngFor="let d of data">
        <span class="bar-label">{{ d.label }}</span>
        <div class="bar-track">
          <div
            class="bar-fill"
            [style.width.%]="pct(d.value)"
            [style.background]="d.color || 'var(--color-accent)'"
          ></div>
        </div>
        <span class="bar-value">{{ d.value }}</span>
      </div>
    </div>
    <ng-template #noData>
      <p class="muted">No data yet.</p>
    </ng-template>
  `
})
export class BarChartComponent {
  @Input() data: ChartDatum[] = [];

  get max(): number {
    return Math.max(1, ...this.data.map((d) => d.value));
  }

  pct(value: number): number {
    return (value / this.max) * 100;
  }
}
