import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Logger } from '~/logger';

@Component({
    selector: 'app-detail',
    templateUrl: './detail.component.html',
    styleUrls: ['./detail.component.scss'],
    standalone: true,
    imports: [RouterLink, TranslateModule]
})
export class DetailComponent implements OnInit {
  private readonly logger: Logger = inject(Logger);

  ngOnInit(): void {
    this.logger.info('DetailComponent INIT', { scope: 'DetailComponent' });
   }

}
