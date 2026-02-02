import { Component, OnInit, inject } from '@angular/core';
import { Logger } from '~/logger';

@Component({
    selector: 'app-page-not-found',
    templateUrl: './page-not-found.component.html',
    styleUrls: ['./page-not-found.component.scss'],
    standalone: true
})
export class PageNotFoundComponent implements OnInit {
  private readonly logger: Logger = inject(Logger);

  ngOnInit(): void {
    this.logger.info('PageNotFoundComponent INIT', { scope: 'PageNotFoundComponent' });
  }
}
