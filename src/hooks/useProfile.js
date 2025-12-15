import { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';

export const useProfile = () => {
  const [profile, setProfile] = useState({
    full_name: 'Admin Root',
    email: 'admin@anithastores.com',
    phone: '+91 98765 43210',
    role: 'Super Admin',
    primary_store: 'Global',
    store_scope: 'All stores • Global scope',
    avatar_url: null
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get user role and data from localStorage
        const userRole = localStorage.getItem('userRole') || 'admin';
        const userDataStr = localStorage.getItem('userData');
        let userData = null;
        if (userDataStr) {
          try {
            userData = JSON.parse(userDataStr);
          } catch (e) {
            console.error('Error parsing userData:', e);
          }
        }

        // For staff users, use userData directly
        if (userRole === 'staff' && userData) {
          setProfile({
            full_name: userData.name || userData.full_name || 'Staff Account',
            email: userData.email || '',
            phone: userData.phone || '',
            role: userData.role || 'Staff',
            primary_store: userData.store || userData.store_allocated || '',
            store_scope: userData.store_allocated || 'Store Access',
            avatar_url: userData.avatar_url || null
          });
          if (userData.avatar_url) {
            setAvatarUrl(userData.avatar_url);
          } else {
            setAvatarUrl('');
          }
          return;
        }

        // For admin and supervisor, fetch from API
        const response = await profileAPI.get();
        if (response.success) {
          const profileData = response.profile;
          setProfile(profileData);
          
          // Set avatar URL if exists
          if (profileData.avatar_url) {
            setAvatarUrl(profileData.avatar_url);
          } else {
            setAvatarUrl('');
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        // Keep default values
      }
    };

    fetchProfile();
  }, []);

  const getAvatarUrl = () => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    const apiBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${apiBase}${avatarUrl}`;
  };

  const getInitials = () => {
    if (!profile.full_name) return 'AR';
    const parts = profile.full_name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return profile.full_name.substring(0, 2).toUpperCase();
  };

  return {
    profile,
    avatarUrl: getAvatarUrl(),
    initials: getInitials(),
    isLoading,
    refreshProfile: async () => {
      try {
        // Get user role and data from localStorage
        const userRole = localStorage.getItem('userRole') || 'admin';
        const userDataStr = localStorage.getItem('userData');
        let userData = null;
        if (userDataStr) {
          try {
            userData = JSON.parse(userDataStr);
          } catch (e) {
            console.error('Error parsing userData:', e);
          }
        }

        // For staff users, use userData directly
        if (userRole === 'staff' && userData) {
          setProfile({
            full_name: userData.name || userData.full_name || 'Staff Account',
            email: userData.email || '',
            phone: userData.phone || '',
            role: userData.role || 'Staff',
            primary_store: userData.store || userData.store_allocated || '',
            store_scope: userData.store_allocated || 'Store Access',
            avatar_url: userData.avatar_url || null
          });
          if (userData.avatar_url) {
            setAvatarUrl(userData.avatar_url);
          } else {
            setAvatarUrl('');
          }
          return;
        }

        // For admin and supervisor, fetch from API
        const response = await profileAPI.get();
        if (response.success) {
          const profileData = response.profile;
          setProfile(profileData);
          if (profileData.avatar_url) {
            setAvatarUrl(profileData.avatar_url);
          } else {
            setAvatarUrl('');
          }
        }
      } catch (err) {
        console.error('Error refreshing profile:', err);
      }
    }
  };
};

