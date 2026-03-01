import { catchError, of } from 'rxjs';

import { AccountService } from '@app/_services';

export function appInitializer(accountService: AccountService) {
    return () => {
        // CRITICAL FIX: Only try to refresh if we have a valid account
        const account = accountService.accountValue;
        
        // Check if user has a valid JWT token before attempting refresh
        if (account && account.jwtToken) {
            console.log('Valid token found, attempting refresh');
            return accountService.refreshToken()
                .pipe(
                    // catch error to start app on success or failure
                    catchError((error) => {
                        console.log('Token refresh failed on startup, continuing anyway');
                        return of();
                    })
                );
        } else {
            // No token exists, skip refresh and continue normally
            console.log('No token found, skipping refresh');
            return of();
        }
    };
}