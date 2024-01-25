import { Component, HostListener } from '@angular/core';
import { MasonryGridService } from './masonry-grid.service';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ElementSchemaRegistry } from '@angular/compiler';

@Component({
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [CommonModule, NgbModule],
  templateUrl: './masonry-grid.component.html',
  styleUrl: './masonry-grid.component.css'
})
export class MasonryGridComponent {
  previous_batch: any = [];
  current_batch:  any = [];
  
  scrollPosition: number = 0;
  
  batchTimeout:   boolean = false;

  constructor(private masonryGridService: MasonryGridService){ 
  }

  ngOnInit() {
    this.masonryGridService.getPhotos().subscribe({
      next: (data: any) =>
      {
        this.current_batch = data;
        this.insertBatch('append');
      },
      error: (error: any) =>
        console.log(error)
    });

  }

  insertBatch(insertType: string){
    let batchSize = this.masonryGridService.getBatchSize();

    let container = document.getElementById('photosContainer')!;

    let batch;
    if(insertType == 'append')
      batch = this.current_batch;
    else if(insertType == 'prepend')
      batch = this.previous_batch.reverse();

    for(let i = 0; i < batchSize; i++){
      let photoDiv = document.createElement('div');
      photoDiv.classList.add('d-flex', 'justify-content-center', 'p-1');

      let photo = document.createElement('img');
      photo.src = batch[i].urls.regular;
      photo.classList.add('w-75','rounded-4');
    
      photoDiv.append(photo);

      if(insertType == 'append')
        container.appendChild(photoDiv);
      else if(insertType == 'prepend')
        container.prepend(photoDiv);
    }
  }

  deleteBatch(batchType: string){
    let batchSize = this.masonryGridService.getBatchSize();

    let container = document.getElementById('photosContainer')!;

    for(var i = 0; i < batchSize; i++){
      let child;

      if(batchType == 'first') child = container.firstChild!;
      else if(batchType == 'last') child = container.lastChild!;
      else return;
      
      container.removeChild(child);
    }
  }

 @HostListener('document:scroll', ['$event'])
  public onScroll(){
    if(this.batchTimeout == true)
      return;
    
    let screenHeight = document.documentElement.scrollHeight;
    
    let newScrollPosition = document.documentElement.scrollTop + window.innerHeight;
    let scrollPercentage = newScrollPosition / screenHeight;
    let scrollDirection = this.scrollPosition < newScrollPosition ? 'down' : 'up';

    this.scrollPosition = newScrollPosition;

    let loadOptions :string = '';

    if(scrollPercentage > 0.8  && scrollDirection == 'down')
      loadOptions = 'next';
    else if(scrollPercentage < 0.2 && scrollDirection == 'up' && this.masonryGridService.getCurrentPage() >= 3)
      loadOptions = 'previous';
    else
      return;

    this.batchTimeout = true;

    let currentPage = this.masonryGridService.getCurrentPage();

    if(loadOptions == 'next')
      currentPage++;
    else if(loadOptions == 'previous')
      currentPage -= 2;

    this.masonryGridService.setCurrentPage(currentPage);
    
    this.masonryGridService.getPhotos().subscribe({
      next: (data: any) =>
      {
        if(loadOptions == 'next'){
          if(this.previous_batch.length != 0)
            this.deleteBatch('first');
          this.previous_batch = this.current_batch;
          this.current_batch = data;
          this.insertBatch('append');
        }
        else if(loadOptions == 'previous'){
          this.deleteBatch('last');
          this.current_batch = this.previous_batch;
          this.previous_batch = data;
          this.insertBatch('prepend');

          this.masonryGridService.setCurrentPage(++currentPage);
        }
      },
      error: (error: any) =>
        console.log(error)
    });
    setTimeout(() => this.batchTimeout = false, 1000);
  }
}
