import { Injectable } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MasonryGridService {
  photos :any = [];
  url: string = 'https://api.unsplash.com/photos?page=1&per_page=20&client_id=KTJuKe-fu6x7GcYpRORakGwAzAEDRROVyn01mah4UWU';

  constructor(private http: HttpClient) { }
  
  getPhotos() {
    this.photos = this.http.get(this.url);
    return this.photos;
  }
}
