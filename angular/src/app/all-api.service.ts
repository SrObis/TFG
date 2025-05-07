import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AllApiService {
  constructor() {}
  baseURL = 'localhost:3000/';
  // baseURL = 'http://localhost/scholar/'

  scrapUrl = this.baseURL + 'scrape/scholar';
}
