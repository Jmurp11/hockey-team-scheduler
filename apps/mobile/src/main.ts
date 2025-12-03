import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// Call the element loader before the bootstrapApplication method
defineCustomElements(window);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
