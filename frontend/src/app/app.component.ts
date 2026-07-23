import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'complaint-portal';

  // Injecting ThemeService here ensures the saved/system theme is applied
  // to <html data-theme="..."> as early as possible on app bootstrap.
  constructor(private themeService: ThemeService) {}
}
