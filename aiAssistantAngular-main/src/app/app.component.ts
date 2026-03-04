import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AccountService } from './_services';
import { Account, Role } from './_models';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.less']
})
export class AppComponent {
    Role = Role;
    account?: Account | null;
    constructor(private accountService: AccountService, private router: Router) {
        this.accountService.account.subscribe(x => this.account = x);
        // Listen for route changes to detect auth pages
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                // trigger change detection
                this.isAuth = this.checkAuthRoute(event.urlAfterRedirects);
            }
        });
    }
    // flag used in template
    isAuth = false;
    private checkAuthRoute(url: string): boolean {
        return url.startsWith('/account');
    }
    logout() {
        this.accountService.logout();
    }
}