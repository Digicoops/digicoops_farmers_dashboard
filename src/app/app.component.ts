import {Component, HostListener} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-root',
  standalone: true,
    imports: [
        RouterModule,
        NgIf,
    ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Angular Ecommerce Dashboard | DIGICOOP';

    isMobile = false;

    constructor(private router: Router) {
        this.checkScreenSize();
    }

    @HostListener('window:resize')
    onResize() {
        this.checkScreenSize();
    }

    private checkScreenSize() {
        this.isMobile = window.innerWidth < 1024 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
}
