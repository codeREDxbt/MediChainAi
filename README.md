# MediChainAI

A privacy-first medical AI dashboard built with Next.js 15, Tailwind CSS, and shadcn/ui components.

## Features

- 🏥 **Secure Upload**: DICOM/NIfTI file upload with encryption
- 🔗 **Federated Learning**: Real-time training status visualization
- 💰 **Wallet**: MC-AI token balance, earnings, and staking
- 📊 **Dashboard**: Overview of scans, accuracy, and chain activity
- 🔬 **AI Analysis**: CT scan results with heatmap overlay

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Card, Button, Badge, Progress, Switch, Tabs, Input)
- **Theming**: next-themes with light/dark mode
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/
│   ├── (app)/           # App routes with bottom nav
│   │   ├── dashboard/   # Main dashboard
│   │   ├── upload/      # Secure upload
│   │   ├── status/      # Federated learning status
│   │   ├── wallet/      # Wallet & earnings
│   │   ├── results/[id] # AI analysis results
│   │   └── settings/    # App settings
│   ├── globals.css      # Theme CSS variables
│   └── layout.tsx       # Root layout with ThemeProvider
├── components/
│   ├── ui/              # shadcn/ui components
│   └── *.tsx            # Custom app components
└── lib/
    ├── mock.ts          # Mock data with TypeScript types
    └── utils.ts         # Utility functions
```

## Theme

The app supports both light and dark themes with carefully matched colors:

- **Light**: Clean whites (#f7f9fb) with soft borders (#e5ebef)
- **Dark**: Deep darks (#111417) with subtle elevation
- **Primary**: Medical blue for CTAs
- **Accent**: Teal/green for positive actions and stakes

## License

MIT
