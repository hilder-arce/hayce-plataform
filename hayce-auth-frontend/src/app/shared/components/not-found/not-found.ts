import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonComponent } from '../button/button.component';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-not-found',
  imports: [CommonModule, RouterLink, ButtonComponent, CardComponent],
  templateUrl: './not-found.html',
})
export class NotFoundComponent {}
