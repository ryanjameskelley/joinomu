# JoinOmu App - Claude Context

## Project Overview
JoinOmu is a healthcare management platform built for patients, administrators, and healthcare providers. The platform enables secure communication, appointment management, and patient care coordination.

## Architecture

### Technology Stack
- **Frontend**: React 18.3+ with TypeScript
- **Build Tool**: Vite 6.0+
- **Backend**: Supabase (Authentication, Database, Real-time)
- **UI Library**: shadcn/ui components
- **Routing**: React Router DOM 6.28+
- **Styling**: Tailwind CSS

### Project Structure
```
src/
├── app/                    # Main application code
│   ├── App.tsx            # Root app component with routing
│   └── components/        # App-specific components
├── script-runner/         # Business logic scripts
│   ├── scripts/          # Individual script files
│   └── utils/            # Script utilities
├── ui/                   # Shared UI components (shadcn/ui)
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
└── types/                # TypeScript type definitions
```

### User Types
1. **Patients**: Access personal health records, communicate with providers
2. **Administrators**: Manage users, system configuration, oversight
3. **Providers**: Healthcare professionals managing patient care

## Key Features
- Multi-role authentication via Supabase
- Real-time messaging and notifications
- Secure patient data management
- Role-based access control
- Responsive design for all devices

## Development Guidelines

### Performance Optimizations
- Code splitting by role and features
- Lazy loading of non-critical components
- Optimized bundle chunks (vendor, supabase, router)
- Tree-shaking for unused code elimination

### Security
- Supabase Row Level Security (RLS) policies
- Role-based route protection
- Secure API communication
- HIPAA-compliant data handling

### Component Organization
- **UI Components**: Atomic, reusable components in `/ui/`
- **Business Logic**: Applied in `/script-runner/` and app components
- **Documentation**: Each component documented in Storybook

## Environment Setup
```bash
npm install                 # Install dependencies
npm run dev                # Start development server
npm run storybook          # Start Storybook documentation
npm run build             # Build for production
```

## Supabase Integration
- Database: PostgreSQL with real-time subscriptions
- Authentication: Multi-role user management
- Storage: Secure file uploads for healthcare documents
- Functions: Server-side business logic

## Contributing
When working on this project:
1. Follow the existing folder structure
2. Use TypeScript for type safety
3. Document components in Storybook
4. Test across all user roles
5. Maintain HIPAA compliance standards

## Recent Context
This project was initialized with:
- Vite + React + TypeScript foundation
- Organized folder structure for scalability
- Performance-optimized build configuration
- shadcn/ui component library integration planned
- Supabase backend integration planned

Component instructions
code:
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function InputFile() {
  return (
    <div className="grid w-full max-w-sm items-center gap-3">
      <Label htmlFor="picture">Picture</Label>
      <Input id="picture" type="file" />
    </div>
  )
}
