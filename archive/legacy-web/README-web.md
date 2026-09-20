# NEMA Compliance Checker - Web Interface

This repository contains the web interface that embeds the NEMA Compliance Checker Streamlit application.

## 🌐 Live Site
- **Production**: [nema.kamandalabs.me](https://nema.kamandalabs.me)
- **Streamlit App**: [nema-kamandalabs.streamlit.app](https://nema-kamandalabs.streamlit.app)

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - NEMA web interface"
   git branch -M main
   git remote add origin https://github.com/yourusername/nema-compliance-web.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure custom domain: `nema.kamandalabs.me`
   - Deploy automatically

### Manual Deployment

```bash
# Clone the repository
git clone https://github.com/yourusername/nema-compliance-web.git
cd nema-compliance-web

# Serve locally (for testing)
python -m http.server 3000 --directory public
# or
npx serve public -p 3000
```

## 📁 Project Structure

```
├── public/
│   ├── index.html          # Main landing page with embedded app
│   └── favicon.svg         # Site favicon
├── vercel.json            # Vercel deployment configuration
├── package.json           # Project metadata
└── README.md             # This file
```

## 🔧 Configuration

### Domain Setup

1. **DNS Configuration**:
   - Add CNAME record: `nema.kamandalabs.me` → `cname.vercel-dns.com`
   - Or A record pointing to Vercel's IP

2. **Vercel Settings**:
   - Add custom domain in Vercel dashboard
   - Enable automatic HTTPS
   - Configure redirects if needed

### Embedding Configuration

The main app is embedded from: `https://nema-kamandalabs.streamlit.app`

Key embed parameters:
- `?embed=true` - Enables embed mode (if supported by Streamlit)
- Responsive iframe sizing
- Loading state management
- Error handling and fallbacks

## 🎨 Customization

### Styling
- Edit `public/index.html` for layout and design changes
- CSS is inline for simplicity and performance
- Responsive design included

### Content
- Update meta tags for SEO
- Modify feature descriptions
- Change branding and colors

### Analytics
Add your analytics code in the `<script>` section of `index.html`.

## 🔒 Security

- X-Frame-Options configured for embedding security
- Content Security Policy headers
- HTTPS enforced
- No sensitive data in client-side code

## 📊 Performance

- Static HTML/CSS/JS only
- Minimal external dependencies
- Optimized for fast loading
- CDN distribution via Vercel

## 🐛 Troubleshooting

### Common Issues

1. **Iframe not loading**:
   - Check if Streamlit app is accessible
   - Verify CORS and X-Frame-Options settings
   - Test fallback link

2. **Domain not working**:
   - Verify DNS propagation (24-48 hours)
   - Check Vercel domain configuration
   - Ensure SSL certificate is active

3. **Mobile display issues**:
   - Test responsive design
   - Adjust iframe dimensions
   - Check viewport meta tag

### Support

- Check Streamlit app status: [nema-kamandalabs.streamlit.app](https://nema-kamandalabs.streamlit.app)
- Vercel deployment logs in dashboard
- Browser developer tools for client-side issues

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

Built with ❤️ by [KamandaLabs](https://kamandalabs.com) for environmental conservation.
