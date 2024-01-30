import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class MasonryGridService {
  currentPage    :number = 1;
  photosPerPage  :number = 20;

  accessKey :string = environment.ACCESS_KEY;
  apiURL    :string = environment.API_URL;

  constructor(private http: HttpClient) { }
  
  getPhotos(): Observable<Object> {
    return this.http.get(this.apiURL, {
      params:{
        page: this.currentPage,
        per_page: this.photosPerPage,
        client_id: this.accessKey
      }
    });
  }

  getBatchSize(){
    return this.photosPerPage;
  }

  setCurrentPage(page: number){
    this.currentPage = page;
  }

  getCurrentPage(){
    return this.currentPage;
  }
}
