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
  previousBatch: any = [];
  currentBatch:  any = [];
  
  scrollPosition: number = 0;
  
  batchTimeout:   boolean = false;

  innerHeight:  number = 0;
  innerWidth:   number = 0;
  photosPerRow: number = 0;

  offsetHeight: number[] = [];
  offsetWidth:  number = 0;

  prevOffsetHeight: number[][] = [];
  prevOffsetWidth:  number[] = [];
  deletedBatches:   number[] = [];

  constructor(private masonryGridService: MasonryGridService){ 
  }

  ngOnInit() {
    this.innerHeight = window.innerHeight;
    this.innerWidth = window.innerWidth;
    
    this.photosPerRow = this.calculatePPR();

    this.offsetHeight = new Array(this.photosPerRow).fill(0);

    this.masonryGridService.getPhotos().subscribe({
      next: (data: any) =>
      {
        this.currentBatch = data;
        this.insertBatch('append');
      },
      error: (error: any) => console.log(error)
    });
  }

  calculatePPR(){
    if(this.innerWidth < 768) return 1;
    else if(this.innerWidth < 992) return 2;
    else if(this.innerWidth < 1200) return 3;
    else return 4;
  }

  setPhotoPosition(photoDiv: HTMLDivElement, i: number,  image:any, insertType: string){
    if(insertType == 'append'){
      if(i % this.photosPerRow  == 0) this.offsetWidth = 0;

      photoDiv.style.left = this.offsetWidth + 'px';
      photoDiv.style.top = this.offsetHeight[i % this.photosPerRow ] + 'px';
    
      this.offsetWidth += this.innerWidth / this.photosPerRow ;
      this.offsetHeight[i % this.photosPerRow ] += (this.innerWidth * image.height) / (image.width * this.photosPerRow);
    }else if(insertType == 'prepend'){
      // if(this.prevOffsetWidth[-1] == 0)
      //   this.prevOffsetWidth[-1] = this.innerWidth;

      // photoDiv.style.left = (this.prevOffsetWidth[-1] - this.innerWidth / this.photosPerRow) + 'px';
      // photoDiv.style.top = (this.offsetHeight[i % this.photosPerRow ] - this.innerWidth * image.height) / (image.width * this.photosPerRow) + 'px';
    
      // this.prevOffsetWidth[-1] -= this.innerWidth / this.photosPerRow ;
      // this.prevOffsetHeight[-1][i % this.photosPerRow ] -= (this.innerWidth * image.height) / (image.width * this.photosPerRow); 
    }

    return photoDiv;
  }

  createPhotoDiv(i: number, image: any, insertType: string){
    let photo = document.createElement('img');
    photo.src = image.urls.regular;
    photo.classList.add('mw-100','mh-100','h-auto','w-auto','object-fit-contain','rounded-3');
    
    let photoDiv = document.createElement('div');
    photoDiv.classList.add('photo-container','p-2');
    photoDiv.style.position = 'absolute';
    photoDiv.style.width = 100 / this.photosPerRow + '%';

    this.setPhotoPosition(photoDiv,i,image,insertType);

    photoDiv.append(photo);

    return photoDiv;
  }

  calculatePrevNewOffset(){
    let index = this.prevOffsetHeight.length;

    if(index == 0){
      this.prevOffsetHeight.push([...this.offsetHeight]);
      this.prevOffsetWidth.push(this.offsetWidth);
      return; 
    } 

    let newOffsetHeight: number[] = new Array(this.photosPerRow).fill(0);
    let newOffsetWidth: number;

    for (let i = 0; i < this.photosPerRow; i++){
      newOffsetHeight[i] = this.offsetHeight[i] - this.prevOffsetHeight[index - 1][i];
    }
    newOffsetWidth = this.offsetWidth;

    this.prevOffsetHeight.push([...newOffsetHeight]);
    this.prevOffsetWidth.push(newOffsetWidth);
  }

  recalculatePositions(){
    if(this.deletedBatches.length == 0) return;

    let remainingPhotos: any[] = Array.from(document.getElementsByClassName('photo-container'));
    let lastBatchDeleted = this.deletedBatches.slice(-1)[0];
    remainingPhotos.forEach((photo, index) => {
      var currentValue = parseFloat(photo.style.top);
      var oldValue = this.prevOffsetHeight[lastBatchDeleted - 1][index % this.photosPerRow];
      var newValue = currentValue - oldValue;
      
      photo.style.top = newValue + 'px';
    });
    
    for(let index = 0; index < this.photosPerRow; index++)
      this.offsetHeight[index] -= this.prevOffsetHeight[lastBatchDeleted - 1][index % this.photosPerRow];

    document.documentElement.scrollTo(0,window.innerHeight / 4 * 10);
  }

  insertBatch(insertType: string){
    let batchSize = this.masonryGridService.getBatchSize();

    let container = document.getElementById('photosContainer')!;

    let batch;
    if(insertType == 'append')
      batch = this.currentBatch;
    else if(insertType == 'prepend')
      batch = this.previousBatch.reverse();

    for(let i = 0; i < batchSize; i++){
      let photoDiv = this.createPhotoDiv(i,batch[i],insertType);

      if(insertType == 'append')
        container.appendChild(photoDiv);
      else if(insertType == 'prepend')
        container.prepend(photoDiv);
    }
    this.calculatePrevNewOffset();
    this.recalculatePositions();
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
    
    let currentPage = this.masonryGridService.getCurrentPage();

    if(scrollPercentage > 0.75  && scrollDirection == 'down'){
      loadOptions = 'next';
      currentPage++;
    }
    else if(scrollPercentage < 0.25 && scrollDirection == 'up' && this.masonryGridService.getCurrentPage() >= 3){
      loadOptions = 'previous';
      currentPage -= 2;
    }
    else
      return;

    this.batchTimeout = true;

    this.masonryGridService.setCurrentPage(currentPage);
    
    this.masonryGridService.getPhotos().subscribe({
      next: (data: any) =>
      {
        if(loadOptions == 'next'){
          if(this.previousBatch.length != 0){
            this.deletedBatches.push(currentPage - 2);
            this.deleteBatch('first');
          }
          this.previousBatch = this.currentBatch;
          this.currentBatch = data;
          this.insertBatch('append');
        }
        else if(loadOptions == 'previous'){
          // this.deleteBatch('last');
          // this.currentBatch = this.previousBatch;
          // this.previousBatch = data;
          // this.insertBatch('prepend');

          // this.masonryGridService.setCurrentPage(++currentPage);
        }        
      },
      error: (error: any) =>
        console.log(error)
    });
    setTimeout(() => this.batchTimeout = false, 500);
  }
}
