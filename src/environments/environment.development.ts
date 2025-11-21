export const environment = {
    production: false,
    cloudflare: {
        accountId: 'd3f3b3f4b5c6d7e8f9a0b1c2d3e4f5g6',
        apiToken: 'your-cloudflare-api-token',
        hash: 'your-cloudflare-image-hash',
    },
    supabase: {
        url: 'https://piipkyjgbpmmybufqkrw.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpaXBreWpnYnBtbXlidWZxa3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjM5NjIsImV4cCI6MjA3NzU5OTk2Mn0.nbz0stOk3Hih--59N2wcCwVL8nOxjhxLelH2jrsaHNQ'
    },
    django: {
        apiUrl: 'http://localhost:8000/api/v1' // URL de votre API Django
    }
};