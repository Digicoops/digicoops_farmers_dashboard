
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type TabOption = 'optionOne' | 'optionTwo' | 'optionThree';

@Component({
  selector: 'app-chart-tab',
  imports: [CommonModule],
  templateUrl: './chart-tab.component.html'
})
export class ChartTabComponent {
  selected: TabOption = 'optionOne';

  setSelected(option: TabOption) {
    this.selected = option;
  }

  getButtonClass(option: TabOption): string {
    return this.selected === option
      ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-background-dark-card'
      : 'text-gray-500 dark:text-gray-400';
  }
}