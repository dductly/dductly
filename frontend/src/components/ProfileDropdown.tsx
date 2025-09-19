import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name?: string;
}

const ProfileDropdown: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsOpen(false);
    window.location.href = '/';
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  if (!user) {
    return null;
  }

  // Get user initials for the profile icon
  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const initials = getInitials(user.name || '', user.email);

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        className="profile-button"
        onClick={toggleDropdown}
        aria-label="Profile menu"
      >
        <div className="profile-icon">
          {initials}
        </div>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <div className="dropdown-avatar">
              {initials}
            </div>
            <div className="dropdown-user-info">
              <div className="dropdown-name">
                {user.name || 'User'}
              </div>
              <div className="dropdown-email">
                {user.email}
              </div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-items">
            <Link
              to="/dashboard"
              className="dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <span className="dropdown-icon">🏠</span>
              Dashboard
            </Link>

            <Link
              to="/faq"
              className="dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <span className="dropdown-icon">❓</span>
              FAQ
            </Link>
          </div>

          <div className="dropdown-divider"></div>

          <button
            className="dropdown-item logout-item"
            onClick={handleLogout}
          >
            <span className="dropdown-icon">🚪</span>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;