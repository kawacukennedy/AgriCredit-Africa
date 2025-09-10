# VeritasAI - ML Model Monitoring Dashboard

A comprehensive machine learning model monitoring dashboard built with Next.js, TypeScript, and Tailwind CSS. VeritasAI provides real-time metrics monitoring, per-prediction explainability, and audit-ready reporting for ML models in production.

## 🚀 Features

- **Real-Time Metrics Dashboard**: Monitor model performance with live charts and key metrics
- **Per-Prediction Explainability**: SHAP value visualization and feature importance analysis
- **Audit-Ready Reports**: Compliance-ready PDF reports with summary graphs and metadata
- **Responsive Design**: Optimized for 1920x1080 and mobile devices
- **Interactive Charts**: Hover details and real-time data updates
- **Alert System**: Configurable thresholds with color-coded notifications

## 📊 Dashboard Components

### 1. Real-Time Metrics Dashboard
- Requests per minute tracking
- Latency monitoring (p95)
- Model accuracy trends
- Drift detection alerts
- Interactive line and bar charts

### 2. Explainability Interface
- Per-prediction SHAP values
- Mini-graph visualizations
- Feature importance rankings
- Prediction confidence scores

### 3. Audit Reports
- Summary metrics visualization
- Distribution analysis
- Compliance documentation
- Exportable report previews

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom React components
- **Deployment**: Vercel (optimized)
- **Version Control**: Git

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kawacukennedy/veritasai.git
cd veritasai
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📱 Pages

- **Dashboard** (`/`) - Real-time metrics and charts
- **Explainability** (`/explainability`) - Per-prediction analysis
- **Reports** (`/reports`) - Audit-ready report previews

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically detect Next.js and deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kawacukennedy/veritasai)

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```

## 📝 Configuration

### Vercel Configuration
The project includes a `vercel.json` file with optimized settings:
- Build command: `npm run build`
- Output directory: `.next`
- Framework: Next.js
- Function timeout: 30 seconds

### Environment Variables
No environment variables are required for the current implementation. For production use with real data sources, you may need:

- `DATABASE_URL` - Database connection string
- `API_BASE_URL` - Backend API endpoint
- `MONITORING_API_KEY` - External monitoring service API key

## 🎨 Customization

### Color Themes
The dashboard uses a consistent color scheme defined in Tailwind CSS:
- **Green**: Success states, positive metrics
- **Red**: Alerts, exceeded thresholds
- **Blue**: Primary actions, charts
- **Yellow**: Warnings, attention states

### Adding New Metrics
1. Create a new component in `src/components/`
2. Add metric data types to TypeScript interfaces
3. Update the dashboard layout in `src/app/page.tsx`

### Custom Charts
Replace placeholder gradients in chart components with real charting libraries:
- Chart.js
- Recharts  
- D3.js
- Plotly.js

## 📊 Data Integration

The current implementation uses mock data. To integrate real data:

1. Replace mock data in components with API calls
2. Add data fetching in Server Components or use SWR/React Query
3. Implement WebSocket connections for real-time updates
4. Add error handling and loading states

## 🔒 Security Considerations

- Implement authentication (NextAuth.js recommended)
- Add API route protection
- Validate user permissions for sensitive reports
- Use HTTPS in production
- Implement CSRF protection

## 📈 Performance

- Uses Next.js App Router for optimal performance
- Server-side rendering for better SEO
- Tailwind CSS for minimal bundle size
- TypeScript for better development experience
- Responsive design for all device sizes

## 🐛 Troubleshooting

### Common Issues

1. **Build failures**: Check Node.js version (18+ required)
2. **Styling issues**: Clear `.next` cache with `rm -rf .next`
3. **TypeScript errors**: Run `npm run lint` to check for issues

### Getting Help

1. Check the [Next.js documentation](https://nextjs.org/docs)
2. Review [Tailwind CSS docs](https://tailwindcss.com/docs)
3. Open an issue in this repository

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔄 Updates

- **v1.0.0**: Initial release with three dashboard mockups
- Real-time metrics monitoring
- SHAP explainability interface
- Audit report previews
- Vercel deployment optimization

---

**Built with ❤️ for the ML community**
