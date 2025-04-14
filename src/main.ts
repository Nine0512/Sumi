import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

window.addEventListener('error', (event) => {
  console.error('Caught in global error handler:', event.error);
});

try {
  console.log('Starting Vue app');
  const app = createApp(App);
  app.mount('#app');
  console.log('Vue app mounted');
} catch (error: any) {
  console.error('Failed to start Vue app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial;">
      <h2>Error Starting Application</h2>
      <p>${error.message}</p>
    </div>
  `;
}
