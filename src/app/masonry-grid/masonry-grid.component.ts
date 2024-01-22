import { Component } from '@angular/core';
import { MasonryGridService } from './masonry-grid.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [HttpClientModule, CommonModule],
  providers: [MasonryGridService],
  templateUrl: './masonry-grid.component.html',
  styleUrl: './masonry-grid.component.css'
})
export class MasonryGridComponent {
  photos: any = [];

  constructor(private masonryGridService: MasonryGridService){
    this.photos = this.masonryGridService.getPhotos();
  }
}
