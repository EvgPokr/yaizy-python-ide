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
        <div className="profile-name">{user?.full_name || user?.username}</div>
        <div className="profile-role">{user?.role}</div>
      </div>

      <div className="dropdown-divider"></div>

      <div className="dropdown-menu">
        <button onClick={handleMyProjects} className="dropdown-item">
          <span className="item-icon">📁</span>
          <span>My Projects</span>
        </button>
        <button onClick={handleLogout} className="dropdown-item logout">
          <span className="item-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
