import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AllApiService } from './all-api.service';

@Injectable({
  providedIn: 'root',
})
export class MockDataService {
  constructor(private http: HttpClient, private allapi: AllApiService) {}

  getMockData(searchQuery: any) {
    let url = this.allapi.scrapUrl;
    let searchTerm = '';
    Object.keys(searchQuery).forEach((item, index) => {
      if (index === 0) {
        searchTerm = '?' + item + '=' + searchQuery[item];
        url = url + searchTerm;
      } else {
        searchTerm = '&' + item + '=' + searchQuery[item];
        url = url + searchTerm;
      }
    });
    return this.http.get(url);
  }
}
