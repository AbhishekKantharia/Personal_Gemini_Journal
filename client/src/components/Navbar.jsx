import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">Gemini Journal</Link>
      </div>
      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>New Entry</Link>
        <Link to="/history" className={location.pathname === '/history' ? 'active' : ''}>History</Link>
        <Link to="/mood" className={location.pathname === '/mood' ? 'active' : ''}>Mood Insights</Link>
      </div>
      <div className="nav-user">
        <img
          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=6366f1&color=fff`}
          alt="avatar"
          className="avatar"
        />
        <span className="user-name">{user.displayName || user.email?.split('@')[0]}</span>
        <button onClick={signOut} className="btn-signout">Sign Out</button>
      </div>
    </nav>
  );
}
