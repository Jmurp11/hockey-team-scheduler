import { Injectable, signal } from '@angular/core';

@Injectable()
export class LoadingService {
    private loadingResource = signal<boolean>(false);

    isLoading = () => this.loadingResource();

    setLoading = (loading: boolean) => {
        this.loadingResource.set(loading);
    };
}
