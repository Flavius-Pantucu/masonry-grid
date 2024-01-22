import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MasonryGridComponent } from './masonry-grid/masonry-grid.component';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NgbModule , MasonryGridComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'masonry-grid';
}
