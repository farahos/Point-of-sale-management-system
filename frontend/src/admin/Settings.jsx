// src/components/Settings.jsx
import { useState } from 'react';
import { useUser } from '../hooks/useUser';
import { 
  Moon, 
  Sun, 
  Bell, 
  Globe, 
  Shield, 
  Database,
  Save,
  RefreshCw,
  Palette
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import toast from "react-hot-toast";
import { Navigate } from 'react-router-dom';


const Settings = () => {
    const { user } = useUser();
     // Redirect non-admin users
  if (user?.role !== "admin") {
    return <Navigate to="/" />;
  }
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    autoSave: true,
    language: 'en',
    dataRetention: 30,
  });

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Save settings to backend/localStorage
    localStorage.setItem('adminSettings', JSON.stringify(settings));
      toast.success('Settings saved successfully!');
  };

  const handleReset = () => {
    const defaultSettings = {
      notifications: true,
      emailAlerts: true,
      autoSave: true,
      language: 'en',
      dataRetention: 30,
    };
    setSettings(defaultSettings);
    localStorage.setItem('adminSettings', JSON.stringify(defaultSettings));
  };

  // Load settings on component mount
  useState(() => {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className={`
        p-6 border-b
        ${theme === 'dark' 
          ? 'bg-gray-900 border-gray-800' 
          : 'bg-white border-green-100'
        }
      `}>
        <h1 className={`
          text-2xl font-bold
          ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
        `}>
          Settings
        </h1>
        <p className={`
          mt-1
          ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}
        `}>
          Manage your application preferences
        </p>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme Settings Card */}
          <div className={`
            rounded-xl p-6
            ${theme === 'dark' 
              ? 'bg-gray-900 border border-gray-800' 
              : 'bg-white border border-green-100 shadow-sm'
            }
          `}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`
                p-2 rounded-lg
                ${theme === 'dark' 
                  ? 'bg-green-900/30 text-green-400' 
                  : 'bg-green-100 text-green-600'
                }
              `}>
                <Palette size={20} />
              </div>
              <h2 className={`
                text-lg font-semibold
                ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
              `}>
                Appearance
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    Theme Mode
                  </p>
                  <p className="text-sm opacity-70">
                    {theme === 'dark' ? 'Dark theme is active' : 'Light theme is active'}
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${theme === 'dark' ? 'bg-green-600' : 'bg-green-200'}
                  `}
                >
                  <span className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
                  `}>
                    {theme === 'dark' ? (
                      <Moon className="w-3 h-3 ml-0.5 mt-0.5" />
                    ) : (
                      <Sun className="w-3 h-3 ml-0.5 mt-0.5" />
                    )}
                  </span>
                </button>
              </div>

              <div className="pt-4 border-t">
                <p className={`
                  text-sm font-medium mb-2
                  ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}
                `}>
                  Theme Preview
                </p>
                <div className="flex space-x-4">
                  <div 
                    onClick={() => document.documentElement.classList.remove('dark')}
                    className={`
                      flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${theme === 'light' 
                        ? 'border-green-500 bg-white' 
                        : 'border-gray-300 bg-gray-50'
                      }
                    `}
                  >
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="flex space-x-2 mt-4">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <div className="w-4 h-4 bg-green-300 rounded"></div>
                      </div>
                    </div>
                    <p className="text-center mt-2 text-sm">Light</p>
                  </div>

                  <div 
                    onClick={() => document.documentElement.classList.add('dark')}
                    className={`
                      flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${theme === 'dark' 
                        ? 'border-green-500 bg-gray-800' 
                        : 'border-gray-700 bg-gray-900'
                      }
                    `}
                  >
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-700 rounded"></div>
                      <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                      <div className="flex space-x-2 mt-4">
                        <div className="w-4 h-4 bg-green-600 rounded"></div>
                        <div className="w-4 h-4 bg-green-800 rounded"></div>
                      </div>
                    </div>
                    <p className="text-center mt-2 text-sm">Dark</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className={`
            rounded-xl p-6
            ${theme === 'dark' 
              ? 'bg-gray-900 border border-gray-800' 
              : 'bg-white border border-green-100 shadow-sm'
            }
          `}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`
                p-2 rounded-lg
                ${theme === 'dark' 
                  ? 'bg-blue-900/30 text-blue-400' 
                  : 'bg-blue-100 text-blue-600'
                }
              `}>
                <Bell size={20} />
              </div>
              <h2 className={`
                text-lg font-semibold
                ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
              `}>
                Notifications
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    Push Notifications
                  </p>
                  <p className="text-sm opacity-70">Receive browser notifications</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.notifications}
                    onChange={(e) => handleChange('notifications', e.target.checked)}
                  />
                  <div className={`
                    relative w-11 h-6 rounded-full peer
                    ${settings.notifications 
                      ? (theme === 'dark' ? 'bg-green-600' : 'bg-green-500') 
                      : (theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300')
                    }
                  `}>
                    <div className={`
                      absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform
                      ${settings.notifications ? 'translate-x-5' : ''}
                    `}></div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    Email Alerts
                  </p>
                  <p className="text-sm opacity-70">Receive important alerts via email</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.emailAlerts}
                    onChange={(e) => handleChange('emailAlerts', e.target.checked)}
                  />
                  <div className={`
                    relative w-11 h-6 rounded-full peer
                    ${settings.emailAlerts 
                      ? (theme === 'dark' ? 'bg-green-600' : 'bg-green-500') 
                      : (theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300')
                    }
                  `}>
                    <div className={`
                      absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform
                      ${settings.emailAlerts ? 'translate-x-5' : ''}
                    `}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Language & Region Card */}
          <div className={`
            rounded-xl p-6
            ${theme === 'dark' 
              ? 'bg-gray-900 border border-gray-800' 
              : 'bg-white border border-green-100 shadow-sm'
            }
          `}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`
                p-2 rounded-lg
                ${theme === 'dark' 
                  ? 'bg-purple-900/30 text-purple-400' 
                  : 'bg-purple-100 text-purple-600'
                }
              `}>
                <Globe size={20} />
              </div>
              <h2 className={`
                text-lg font-semibold
                ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
              `}>
                Language & Region
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`
                  block text-sm font-medium mb-2
                  ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}
                `}>
                  Language
                </label>
                <select 
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className={`
                    w-full p-3 rounded-lg border transition-colors
                    ${theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-green-500' 
                      : 'bg-white border-green-200 text-gray-900 focus:border-green-500'
                    }
                  `}
                >
                  <option value="en">English</option>
                  <option value="so">Somali</option>
                  <option value="ar">Arabic</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>

              <div>
                <label className={`
                  block text-sm font-medium mb-2
                  ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}
                `}>
                  Data Retention (days)
                </label>
                <input 
                  type="range" 
                  min="7" 
                  max="365" 
                  value={settings.dataRetention}
                  onChange={(e) => handleChange('dataRetention', parseInt(e.target.value))}
                  className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm opacity-70 mt-1">
                  <span>7 days</span>
                  <span>{settings.dataRetention} days</span>
                  <span>1 year</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data & Security Card */}
          <div className={`
            rounded-xl p-6
            ${theme === 'dark' 
              ? 'bg-gray-900 border border-gray-800' 
              : 'bg-white border border-green-100 shadow-sm'
            }
          `}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`
                p-2 rounded-lg
                ${theme === 'dark' 
                  ? 'bg-red-900/30 text-red-400' 
                  : 'bg-red-100 text-red-600'
                }
              `}>
                <Shield size={20} />
              </div>
              <h2 className={`
                text-lg font-semibold
                ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
              `}>
                Data & Security
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    Auto Save
                  </p>
                  <p className="text-sm opacity-70">Automatically save changes</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.autoSave}
                    onChange={(e) => handleChange('autoSave', e.target.checked)}
                  />
                  <div className={`
                    relative w-11 h-6 rounded-full peer
                    ${settings.autoSave 
                      ? (theme === 'dark' ? 'bg-green-600' : 'bg-green-500') 
                      : (theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300')
                    }
                  `}>
                    <div className={`
                      absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform
                      ${settings.autoSave ? 'translate-x-5' : ''}
                    `}></div>
                  </div>
                </label>
              </div>

              <button className={`
                w-full p-3 rounded-lg border flex items-center justify-center space-x-2
                transition-colors
                ${theme === 'dark' 
                  ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                  : 'border-green-200 hover:bg-green-50 text-green-600'
                }
              `}>
                <Database size={16} />
                <span>Export Data</span>
              </button>

              <button className={`
                w-full p-3 rounded-lg border flex items-center justify-center space-x-2
                transition-colors
                ${theme === 'dark' 
                  ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                  : 'border-green-200 hover:bg-green-50 text-green-600'
                }
              `}>
                <Shield size={16} />
                <span>Privacy Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={handleSave}
            className={`
              flex-1 flex items-center justify-center space-x-2 p-4 rounded-lg
              transition-colors font-medium
              ${theme === 'dark' 
                ? 'bg-green-700 hover:bg-green-600 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
              }
            `}
          >
            <Save size={20} />
            <span>Save Settings</span>
          </button>

          <button
            onClick={handleReset}
            className={`
              flex-1 flex items-center justify-center space-x-2 p-4 rounded-lg border
              transition-colors font-medium
              ${theme === 'dark' 
                ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                : 'border-green-200 hover:bg-green-50 text-green-600'
              }
            `}
          >
            <RefreshCw size={20} />
            <span>Reset to Default</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;