import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import './ProfileDropdown.css';

interface ProfileDropdownProps {
  onClose: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleMyProjects = () => {
    navigate('/projects');
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <div className="profile-header">
        {user?.full_name && <div className="profile-fullname">{user.full_name}</div>}
        <div className="profile-name">{user?.username}</div>
      </div>

      <div className="dropdown-divider"></div>

      <div className="dropdown-menu">
        <button onClick={handleMyProjects} className="dropdown-item">
          <span className="item-icon">📁</span>
          <span>My Projects</span>
        </button>
        <div className="dropdown-divider"></div>
        <button onClick={handleLogout} className="dropdown-item logout">
          <span className="item-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m16 17 5-5-5-5"/>
              <path d="M21 12H9"/>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            </svg>
          </span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
