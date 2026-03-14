# Global Semplice Custom Header Code

Use this block in **Semplice > Settings > General > Header Custom Code** to force the "Sign of the Horns" icon across the entire site. 

The `?v=3` at the end of the image URLs acts as a cache-buster to force mobile browsers (like Safari) to refresh their icon memory immediately.

```html
<!-- Forced Mobile & Desktop Icons (Cache Buster v3) -->
<link rel="apple-touch-icon" href="https://omarthecreative.com/wp-content/uploads/2025/08/sign-of-the-horns-medium-light-skin-tone-noto-512.png?v=3">
<link rel="shortcut icon" href="https://omarthecreative.com/wp-content/uploads/2025/08/sign-of-the-horns-medium-light-skin-tone-noto-512.png?v=3">
<link rel="icon" type="image/png" href="https://omarthecreative.com/wp-content/uploads/2025/08/sign-of-the-horns-medium-light-skin-tone-noto-512.png?v=3">

<!-- Existing Styles & Scripts -->
<link rel="stylesheet" href="https://use.typekit.net/fqr6eyz.css">                                                                 
<link rel="stylesheet" href="https://use.typekit.net/shz5hny.css">
<meta name="theme-color" content="#050505">                                                                                        
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">                                                    
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script>
  tailwind.config = {
    darkMode: "media",
    theme: {
      extend: {
        colors: {
          "primary": "#d26546",
          "background-dark": "#050505",
        },
        fontFamily: {
          "display": ["Work Sans", "sans-serif"],
          "mono": ["Courier New", "Courier", "monospace"]
        }
      }
    }
  }
</script>
```
