'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useLanguage } from '@/lib/i18n';
import { User, Key, Trash2, Save, Camera } from 'lucide-react';
import Image from 'next/image';

// Define a User interface based on the provided data
interface UserProfile {
  avatar?: string;
}

interface UserData {
  _id: string;
  username: string;
  email: string;
  role: string;
  wallet_balance: number;
  profile: UserProfile;
  createdAt: string;
}

// Reusable Card component for this page
const SettingsCard = ({ title, description, children }: { title: string, description: string, children: ReactNode }) => (
  <div className="rounded-xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm">
    <div className="p-6 border-b border-white/5">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="text-sm text-zinc-400 mt-1">{description}</p>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const DangerZoneCard = ({ title, description, children }: { title: string, description: string, children: ReactNode }) => (
    <div className="rounded-xl border border-red-500/30 bg-red-900/10">
      <div className="p-6">
        <h2 className="text-lg font-bold text-red-400">{title}</h2>
        <p className="text-sm text-zinc-400 mt-1 mb-6">{description}</p>
        {children}
      </div>
    </div>
);


export default function ProfilePage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
      const parsedUser: UserData = JSON.parse(userDataString);
      setUser(parsedUser);
      setUsername(parsedUser.username);
      setEmail(parsedUser.email);
      setAvatarUrl(parsedUser.profile.avatar || '');
    }
    setLoading(false);
  }, []);

  if (loading) {
    // A simple skeleton loader
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-1/3 bg-zinc-800 rounded-md"></div>
        <div className="h-64 bg-zinc-900 rounded-xl"></div>
        <div className="h-72 bg-zinc-900 rounded-xl"></div>
        <div className="h-48 bg-zinc-900 rounded-xl"></div>
      </div>
    );
  }

  if (!user) {
    return <div>User not found. Please log in again.</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">{t('profileSettings')}</h1>

      {/* Profile Details Card */}
      <SettingsCard title={t('personalInfo')} description={t('personalInfoDesc')}>
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative group w-32 h-32">
              <img
                src={avatarUrl || `/default-avatar.png`}
                alt="Avatar"
                className="rounded-full ring-2 ring-white/10 object-cover w-32 h-32"
              />
              <button className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="h-8 w-8 text-white" />
              </button>
            </div>
          </div>
          {/* Form */}
          <div className="flex-grow w-full space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-zinc-400 mb-2">{t('username')}</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">{t('email')}</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="avatar" className="block text-sm font-medium text-zinc-400 mb-2">Avatar URL</label>
                <input
                  type="text"
                  id="avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/my-avatar.jpg"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                <Save className="h-4 w-4" />
                {t('saveChanges')}
              </button>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Change Password Card */}
      <SettingsCard title={t('changePassword')} description={t('changePasswordDesc')}>
        <div className="max-w-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">{t('currentPassword')}</label>
            <input type="password" placeholder="••••••••" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">{t('newPassword')}</label>
            <input type="password" placeholder="••••••••" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">{t('confirmNewPassword')}</label>
            <input type="password" placeholder="••••••••" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors" />
          </div>
          <div className="pt-2 flex justify-end">
            <button className="flex items-center gap-2 rounded-lg bg-zinc-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-zinc-600 transition-colors">
              <Key className="h-4 w-4" />
              {t('updatePassword')}
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* Danger Zone */}
      <DangerZoneCard title={t('dangerZone')} description={t('dangerZoneDesc')}>
        <button className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20">
          <Trash2 className="h-4 w-4" />
          {t('deleteAccount')}
        </button>
      </DangerZoneCard>
    </div>
  );
}
