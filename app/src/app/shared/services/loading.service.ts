import { signal } from '@angular/core';

export class LoadingService {
    private loadingResource = signal<boolean>(false);

    isLoading = () => this.loadingResource();

    setLoading = (loading: boolean) => {
        this.loadingResource.set(loading);
    };
}
