import { useState } from 'react';
import { ArrowUpRight, Compass, Menu, X, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  health?: any;
}

export const Navbar = ({ }: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <nav className="nav-inner" aria-label="Main navigation">
        <a className="brand" href="#home" aria-label="Roamly home" onClick={closeMenu}>
          <span className="brand-mark"><Compass size={25} strokeWidth={2.2} aria-hidden="true" /></span>
          <span className="brand-copy">
            <strong>Roamly</strong>
            <span>Direct Travel &amp; Instant Booking</span>
          </span>
        </a>

        <div className={`nav-links${menuOpen ? ' nav-links-open' : ''}`}>
          <a href="#inspiration" onClick={closeMenu}>Inspiration</a>
          <a href="#trip-planner" onClick={closeMenu}>Plan trip</a>
          <a href="#how-it-works" onClick={closeMenu}>How it works</a>
          <a href="#faq" onClick={closeMenu}>FAQs</a>
          <span
            className="engine-status"
            title="Direct Booking Engine is operational"
          >
            <span className="status-dot" />
            <ShieldCheck size={14} aria-hidden="true" className="text-emerald-400" />
            <span>Direct Booking Active</span>
          </span>
          <a className="nav-cta" href="#trip-planner" onClick={closeMenu}>
            Plan a trip <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          className="nav-menu-button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
    </header>
  );
};
