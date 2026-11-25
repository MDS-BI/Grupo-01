import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import { initApp } from './app.js';
import { userConfig } from './module-config.js';

initApp(userConfig);

export { initApp };
