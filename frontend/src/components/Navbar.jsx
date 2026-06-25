import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const confirmLogout = async () => {
    setLoggingOut(true);
    await logout();
    setShowModal(false);
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to={user ? '/chat' : '/login'}>
            EDAC <span className="brand-dot" />
          </Link>
        </div>

        <div className="navbar-links">
          {user ? (
            <>
              <Link to="/chat" className={isActive('/chat')}>Chat</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className={isActive('/admin')}>Admin</Link>
              )}
              <div className="navbar-divider" />
              <div className="navbar-user">
                <span className="user-name">{user.name}</span>
                <span className={`role-badge ${user.role}`}>{user.role}</span>
                <button
                  className="logout-btn"
                  onClick={() => setShowModal(true)}
                  title="Logout"
                  aria-label="Logout"
                >
                  ⏻
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login"    className={isActive('/login')}>Login</Link>
              <Link to="/register" className={isActive('/register')}>Register</Link>
            </>
          )}
        </div>
      </nav>

      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <div className="modal-box">
            <div className="modal-icon">🚪</div>
            <h3 id="logout-title">Sign out?</h3>
            <p>You'll need to sign in again to access your account and chat history.</p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowModal(false)} disabled={loggingOut}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmLogout} disabled={loggingOut}>
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
