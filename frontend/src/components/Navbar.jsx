import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const onLogout = async () => {
    await logout();
    toast.info('You have been logged out');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg site-nav navbar-dark">
      <div className="container">
        <Link to="/" className="brand" onClick={close}>Stacks<span>.</span></Link>
        <button className="navbar-toggler" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0" onClick={close}>
            {user && <li className="nav-item"><NavLink className="nav-link" to="/" end>Dashboard</NavLink></li>}
            {user && <li className="nav-item"><NavLink className="nav-link" to="/books">Books</NavLink></li>}
            {user && <li className="nav-item"><NavLink className="nav-link" to="/loans">{user.role === 'admin' ? 'All loans' : 'My loans'}</NavLink></li>}
            {user?.role === 'admin' && <li className="nav-item"><NavLink className="nav-link" to="/members">Members</NavLink></li>}
          </ul>
          <ul className="navbar-nav align-items-lg-center gap-lg-2" onClick={close}>
            {user ? (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link d-flex align-items-center gap-2" to="/profile">
                    <Avatar user={user} size={30} />
                    {user.name.split(' ')[0]}
                    {user.role === 'admin' && <span className="badge text-bg-warning">Admin</span>}
                  </NavLink>
                </li>
                <li className="nav-item"><button className="btn btn-sm btn-outline-light" onClick={onLogout}>Log out</button></li>
              </>
            ) : (
              <>
                <li className="nav-item"><NavLink className="nav-link" to="/login">Log in</NavLink></li>
                <li className="nav-item"><Link className="btn btn-sm btn-warning" to="/register">Create account</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
