import { Outlet } from 'react-router';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <div className="max-w-[1200px] mx-auto px-3 pb-3">
        <div className="bg-white border border-[var(--border)] rounded-xl min-h-[calc(100vh-56px-12px)] overflow-hidden">
          <main>
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
