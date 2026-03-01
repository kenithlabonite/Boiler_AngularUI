import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AccountService } from '@app/_services';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private accountService: AccountService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            // CRITICAL FIX: Don't logout if it's a chatbot request!
            const isChatbotRequest = request.url.includes('/chatbot');
            const isRefreshTokenRequest = request.url.includes('/refresh-token');
            
            // Handle refresh token failures separately - SILENTLY
            if (isRefreshTokenRequest && [400, 401].includes(err.status)) {
                // Refresh token failed - this is expected if no valid token exists
                // Clear any stored tokens silently without logging out
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // Clear cookies
                document.cookie.split(";").forEach(c => {
                    document.cookie = c.trim().split("=")[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
                });
                
                // Return error silently (don't log to console)
                const error = 'No valid refresh token';
                return throwError(() => error);
            }
            
            if ([401, 403].includes(err.status) && this.accountService.accountValue && !isChatbotRequest) {
                // auto logout if 401 or 403 response returned from api
                // BUT NOT for chatbot requests or refresh token requests
                console.log('Unauthorized - logging out');
                this.accountService.logout();
            }

            // For chatbot errors, just log them
            if (isChatbotRequest) {
                console.error('Chatbot error (not logging out):', err);
            } else if (!isRefreshTokenRequest) {
                console.error('API error:', err);
            }

            const error = (err && err.error && err.error.message) || err.statusText;
            return throwError(() => error);
        }))
    }
}