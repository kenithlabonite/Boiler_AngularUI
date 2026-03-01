import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { environment } from '@environments/environment';
import { Account } from '@app/_models';

const baseUrl = `${environment.apiUrl}/accounts`;

@Injectable({ providedIn: 'root' })
export class AccountService {
    private accountSubject: BehaviorSubject<Account | null>;
    public account: Observable<Account | null>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.accountSubject = new BehaviorSubject<Account | null>(null);
        this.account = this.accountSubject.asObservable();
    }

    public get accountValue() {
        return this.accountSubject.value;
    }

    login(email: string, password: string) {
        return this.http.post<any>(`${baseUrl}/authenticate`, { email, password }, { withCredentials: true })
            .pipe(map(account => {
                this.accountSubject.next(account);
                this.startRefreshTokenTimer();
                return account;
            }));
    }

    logout() {
        this.http.post<any>(`${baseUrl}/revoke-token`, {}, { withCredentials: true }).subscribe();
        this.stopRefreshTokenTimer();
        this.accountSubject.next(null);
        this.router.navigate(['/account/login']);
    }

    refreshToken() {
        // SAFETY CHECK: Don't even try if no account exists
        if (!this.accountValue) {
            console.log('No account to refresh, skipping');
            return throwError(() => new Error('No account to refresh'));
        }

        return this.http.post<any>(`${baseUrl}/refresh-token`, {}, { withCredentials: true })
            .pipe(
                map((account) => {
                    this.accountSubject.next(account);
                    this.startRefreshTokenTimer();
                    return account;
                }),
                catchError(error => {
                    // If refresh fails, silently stop the timer and clear account
                    console.log('Token refresh failed, clearing session');
                    this.stopRefreshTokenTimer();
                    this.accountSubject.next(null);
                    return throwError(() => error);
                })
            );
    }

    register(account: Account) {
        return this.http.post(`${baseUrl}/register`, account);
    }

    verifyEmail(token: string) {
        return this.http.post(`${baseUrl}/verify-email`, { token });
    }

    forgotPassword(email: string) {
        return this.http.post(`${baseUrl}/forgot-password`, { email });
    }

    validateResetToken(token: string) {
        return this.http.post(`${baseUrl}/validate-reset-token`, { token });
    }

    resetPassword(token: string, password: string, confirmPassword: string) {
        return this.http.post(`${baseUrl}/reset-password`, { token, password, confirmPassword });
    }

    getAll() {
        return this.http.get<Account[]>(baseUrl);
    }

    getById(AccountId: string) {
        return this.http.get<Account>(`${baseUrl}/${AccountId}`);
    }

    create(params: any) {
        return this.http.post(baseUrl, params);
    }

    update(AccountId: string, params: any) {
        return this.http.put(`${baseUrl}/${AccountId}`, params)
            .pipe(map((account: any) => {
                // update the current account if it was updated
                if (account.AccountId === this.accountValue?.AccountId) {
                    // publish updated account to subscribers
                    account = { ...this.accountValue, ...account };
                    this.accountSubject.next(account);
                }
                return account;
            }));
    }

    delete(AccountId: string) {
        return this.http.delete(`${baseUrl}/${AccountId}`)
            .pipe(finalize(() => {
                // auto logout if the logged in account was deleted
                if (AccountId === this.accountValue?.AccountId)
                    this.logout();
            }));
    }

    // helper methods

    private refreshTokenTimeout?: any;

    private startRefreshTokenTimer() {
        // CRITICAL FIX: Check if account and token exist before trying to parse
        if (!this.accountValue || !this.accountValue.jwtToken) {
            console.log('No valid account or token to refresh');
            return;
        }

        try {
            // parse json object from base64 encoded jwt token
            const jwtBase64 = this.accountValue.jwtToken.split('.')[1];
            const jwtToken = JSON.parse(atob(jwtBase64));

            // set a timeout to refresh the token a minute before it expires
            const expires = new Date(jwtToken.exp * 1000);
            const timeout = expires.getTime() - Date.now() - (60 * 1000);
            
            // Only set timeout if it's positive (token hasn't already expired)
            if (timeout > 0) {
                this.refreshTokenTimeout = setTimeout(() => {
                    this.refreshToken().subscribe({
                        error: (err) => {
                            console.error('Auto refresh token failed:', err);
                            // Don't logout automatically, let user continue
                        }
                    });
                }, timeout);
                console.log(`Token refresh scheduled in ${Math.round(timeout / 1000)} seconds`);
            } else {
                console.log('Token already expired, not scheduling refresh');
            }
        } catch (error) {
            console.error('Error parsing JWT token:', error);
        }
    }

    private stopRefreshTokenTimer() {
        if (this.refreshTokenTimeout) {
            clearTimeout(this.refreshTokenTimeout);
            this.refreshTokenTimeout = undefined;
        }
    }
}