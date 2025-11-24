import {Component, OnInit} from '@angular/core';
import { GridShapeComponent } from '../../components/common/grid-shape/grid-shape.component';
import { RouterModule } from '@angular/router';
import { ThemeToggleTwoComponent } from '../../components/common/theme-toggle-two/theme-toggle-two.component';
import Typewriter from 'typewriter-effect/dist/core';

@Component({
  selector: 'app-auth-page-layout',
  imports: [
    GridShapeComponent,
    RouterModule,
    ThemeToggleTwoComponent,
  ],
  templateUrl: './auth-page-layout.component.html',
  styles: ``
})
export class AuthPageLayoutComponent implements OnInit{
  ngOnInit(): void {
    new Typewriter('#typewriter', {
      strings: [
        'Un marché digital à portée de main.',
        'Connectez vos produits au monde.',
      ],
      autoStart: true,
      loop: true,
      delay: 45,

    });

  }


}
