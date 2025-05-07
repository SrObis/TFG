import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { MockDataService } from './mock.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import axios from 'axios';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FormsModule,
    HttpClientModule,
    NgxSpinnerModule,
    CommonModule,
  ],
  providers: [NgxSpinnerService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  filters = {
    author: '',
    year: '',
  };
  searchQueryText = '';
  results: any = [];
  filteredResults: any = [];
  searchQuery: HttpParams = new HttpParams();
  showCustomRange = false;
  isModalOpen = false;

  constructor(
    private mockDataService: MockDataService,
    private spinner: NgxSpinnerService,
    private router: ActivatedRoute,
    private routerLink: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.router.queryParams.subscribe((params: any) => {
      this.filteredResults = [];
      const queryParams = params;
      this.searchQueryText = queryParams.q;
      this.performSearch(queryParams);
    });
  }

  toggleShowCustomRange() {
    this.showCustomRange = !this.showCustomRange;
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async performSearch(queryParams: any) {
    this.spinner.show();

    const scrapUrl = 'http://localhost:3000/scrape/scholar'; // Replace with your actual API URL

    const queryParamsString = Object.entries(queryParams)
      .map(([key, value]: any) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    const url = `${scrapUrl}?${queryParamsString}`;

    try {
      const response = await axios.get(url);
      console.log(response.data);
      this.spinner.hide();

      if (response.data.success) {
        this.filteredResults = [response.data];
        console.log(this.filteredResults);
      }
    } catch (error) {
      console.error(error);
      this.spinner.hide();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (file.type !== 'text/plain') {
      alert('Please upload a valid .txt file.');
      return;
    }

    const reader = new FileReader();
    this.spinner.show();

    reader.onload = async () => {
      this.fileContent = reader.result as string;
      this.fileContent = this.fileContent.split(', ');
      this.filteredResults = [];
      const scrapUrl = 'http://localhost:3000/scrape/scholar';

      console.log(this.fileContent);

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      const results = [];
      for (const f of this.fileContent) {
        const url = `${scrapUrl}?q=${f}`;
        const response = await axios.get(url);
        results.push(response);

        // Wait for 1 minute before the next API call
        await delay(1000);
      }

      console.log(results);
      this.spinner.hide();


      const x = await Promise.all(results);
      x.forEach((result) => {
        this.filteredResults.push(result.data)
        this.updateFilteredText()
      })


    };

    reader.onerror = () => {
      console.error('Error reading file:', reader.error);
    };

    reader.readAsText(file);
  }

  activeItemIndex: number | null = null;

  selectedItem: any;
  response: any;

  selectItem(selectedItem: any) {
    this.selectedItem = selectedItem;
    this.openWindow(this.selectedItem.citeUrl);
  }

  clickSingleArticle(index: number): void {
    this.activeItemIndex = this.activeItemIndex === index ? null : index;
  }

  applyFilters(type: string, value: string) {
    if (
      !this.searchQueryText ||
      !['scisbd', 'as_ylo', 'as_rr', 'q'].includes(type)
    )
      return;

    this.searchQuery = value
      ? this.searchQuery.set(type, value)
      : this.searchQuery.delete(type);
    this.routerLink.navigate(['/'], {
      queryParams: this.convertHttpParamsToObject(this.searchQuery),
    });
  }


  filteredText = ''
  updateFilteredText() {
    if (this.filteredResults && this.filteredResults.length > 1) {
      this.filteredText = this.filteredResults.map((item:any) => item?.content).join('\n');
    } else {
      this.filteredText = '';
    }
  }


  convertHttpParamsToObject(params: HttpParams): { [key: string]: string } {
    const paramObj: { [key: string]: string } = {};
    params.keys().forEach((key) => {
      paramObj[key] = params.get(key) || '';
    });
    return paramObj;
  }

  getQueryParam(key: string): string | null {
    return this.searchQuery.get(key);
  }

  // Utility function to convert HttpParams to an object

  copyText() {
    const textArea = document.getElementById(
      'text-area'
    ) as HTMLTextAreaElement;
    textArea.select();
    document.execCommand('copy');
    alert('Text copied to clipboard!');
  }

  fileContent: any;

  openWindow = (url: string) => {
    const windowWidth = 500;
    const windowHeight = 400;

    const left = screen.width / 2 - windowWidth / 2;
    const top = screen.height / 2 - windowHeight / 2;

    window.open(
      url,
      '_blank',
      `width=${windowWidth},height=${windowHeight},top=${top},left=${left}`
    );
  };
}
