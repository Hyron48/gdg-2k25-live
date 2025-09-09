import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AuthToken} from '@google/genai';

@Injectable({
    providedIn: 'root'
})
export class VirtualAssistantHttpService {
    private http: HttpClient = inject(HttpClient);

    public generateEphemeralToken(): Observable<AuthToken> {
        return this.http.get<AuthToken>('http://localhost:8080/api/v1/generate-ephemeral-token');
    }
}
