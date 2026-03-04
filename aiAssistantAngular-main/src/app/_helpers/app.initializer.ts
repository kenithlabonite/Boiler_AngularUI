import { catchError, of } from 'rxjs';

import { AccountService } from '@app/_services';

export function appInitializer(accountService: AccountService) {
    return () => {
        // Attempt to refresh token on app startup to keep user logged in across reloads
        console.log('Attempting refresh token on app startup...');
        return accountService.refreshToken()
            .pipe(
                // catch error to start app on success or failure
                catchError((error) => {
                    console.log('Token refresh failed on startup, continuing anyway');
                    return of();
                })
            );
    };
}