import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1 w-full bg-slate-50/50">
        <div className="container mx-auto py-8 px-4 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
