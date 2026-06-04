import React, { useState, useEffect } from 'react';
import LiveMap from '../components/Map/LiveMap';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { triggerSOS, getContacts, addContact, deleteContact, getSOSHistory } from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [history, setHistory] = useState([]);
  const [sosLoading, setSosLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '' });
  const [addingContact, setAddingContact] = useState(false);
  const [fakeCallActive, setFakeCallActive] = useState(false);
  const [callerName, setCallerName] = useState('Mom');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [emergencyNumber, setEmergencyNumber] = useState(
    localStorage.getItem('emergencyNumber') || '112'
  );

  useEffect(() => {
    fetchContacts();
    fetchHistory();
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallButton(true);
    });
  }, []);

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShowInstallButton(false);
        toast.success('App installed successfully!');
      }
    }
  };

  const fetchContacts = async () => {
    try {
      const { data } = await getContacts();
      setContacts(data);
    } catch (error) {
      toast.error('Failed to fetch contacts');
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await getSOSHistory();
      setHistory(data);
    } catch (error) {
      console.log('Failed to fetch history');
    }
  };

  const handleSOS = async () => {
    if (contacts.length === 0) {
      toast.error('Please add trusted contacts first!');
      return;
    }

    setSosLoading(true);

    const getLocation = () => {
      return new Promise((resolve) => {
        if (currentLocation) {
          resolve(currentLocation);
        } else {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            },
            () => {
              resolve({ lat: 0, lng: 0 });
            }
          );
        }
      });
    };

    const location = await getLocation();
    const locationLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    const message = `🚨 EMERGENCY ALERT! I need immediate help! My Live Location: ${locationLink}`;

    // Layer 1 — Online SOS
    try {
      await triggerSOS({ lat: location.lat, lng: location.lng });
      toast.success('🚨 Online SOS Alert sent to ALL contacts!');
      fetchHistory();
    } catch (error) {
      toast.warn('⚠️ No internet! Trying offline SMS...');

      // Layer 2 — Offline SMS
      for (const contact of contacts) {
        try {
          const smsLink = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
          window.open(smsLink);
        } catch (smsError) {
          console.log(`SMS failed for ${contact.name}`);
        }
      }
      toast.success('📱 Offline SMS triggered for all contacts!');
    }

    setSosLoading(false);
  };

  const handleAddContact = async (e) => {
    e.preventDefault();

    if (!newContact.email) {
      toast.error('Email is required for sending alerts!');
      return;
    }

    setAddingContact(true);
    try {
      await addContact(newContact);
      toast.success('✅ Contact added successfully!');
      setNewContact({ name: '', phone: '', email: '' });
      fetchContacts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add contact');
    }
    setAddingContact(false);
  };

  const handleDeleteContact = async (id) => {
    try {
      await deleteContact(id);
      toast.success('Contact deleted!');
      fetchContacts();
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const handleFakeCall = () => {
    setFakeCallActive(true);
    setTimeout(() => setFakeCallActive(false), 30000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Fake Call Screen */}
      {fakeCallActive && (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
          <div className="text-white text-center">
            <div className="text-8xl mb-6">📱</div>
            <h2 className="text-3xl font-bold mb-2">{callerName}</h2>
            <p className="text-gray-400 text-lg mb-12">Incoming Call...</p>
            <div className="flex gap-16">
              <button
                onClick={() => setFakeCallActive(false)}
                className="bg-red-500 rounded-full p-6 text-4xl"
              >
                📵
              </button>
              <button
                onClick={() => setFakeCallActive(false)}
                className="bg-green-500 rounded-full p-6 text-4xl"
              >
                📞
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-red-500 text-white p-4 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-xl font-bold">🚨 Women Safety</h1>
          <p className="text-red-100 text-sm">Welcome, {user?.name}!</p>
        </div>
        <div className="flex gap-2">
          {showInstallButton && (
            <button
              onClick={handleInstallApp}
              className="bg-white text-red-500 px-3 py-2 rounded-lg text-sm font-semibold"
            >
              📲 Install
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-md">
        <div className="flex">
          {[
            { id: 'home', label: '🏠 Home' },
            { id: 'contacts', label: '👥 Contacts' },
            { id: 'fakecall', label: '📞 Fake Call' },
            { id: 'history', label: '📜 History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-500'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto">

        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="py-4">
            <p className="text-gray-600 mb-4 text-lg text-center">
              Press the SOS button in case of emergency!
            </p>

            {/* Live Map */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">📍 Your Live Location</h3>
              <LiveMap onLocationUpdate={setCurrentLocation} />
              {currentLocation && (
                <p className="text-gray-400 text-xs mt-1 text-center">
                  📍 {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* SOS Button */}
            <div className="text-center">
              <button
                onClick={handleSOS}
                disabled={sosLoading}
                className="w-44 h-44 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold text-2xl shadow-2xl transform transition hover:scale-105 active:scale-95 mx-auto flex flex-col items-center justify-center border-8 border-red-300"
              >
                {sosLoading ? (
                  <>
                    <span className="text-4xl animate-pulse">📡</span>
                    <span className="mt-2 text-lg">Sending...</span>
                  </>
                ) : (
                  <>
                    <span className="text-5xl">🆘</span>
                    <span className="mt-2">SOS</span>
                    <span className="text-sm font-normal mt-1">Press for Help</span>
                  </>
                )}
              </button>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white rounded-xl p-4 shadow text-center">
                <div className="text-3xl mb-2">👥</div>
                <p className="text-2xl font-bold text-red-500">{contacts.length}</p>
                <p className="text-gray-500 text-sm">Trusted Contacts</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow text-center">
                <div className="text-3xl mb-2">📜</div>
                <p className="text-2xl font-bold text-red-500">{history.length}</p>
                <p className="text-gray-500 text-sm">SOS Alerts Sent</p>
              </div>
            </div>

            {/* Emergency Actions */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => {
                  if (contacts.length === 0) {
                    toast.error('Please add trusted contacts first!');
                    return;
                  }
                  const location = currentLocation || { lat: 0, lng: 0 };
                  const locationLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
                  const msg = `🚨 EMERGENCY! I need help! Location: ${locationLink}`;
                  const smsLink = `sms:${contacts[0].phone}?body=${encodeURIComponent(msg)}`;
                  window.location.href = smsLink;
                  toast.success('📱 SMS opened!');
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl flex flex-col items-center shadow-lg"
              >
                <span className="text-2xl mb-1">📱</span>
                <span className="text-sm">Offline SMS</span>
                <span className="text-xs font-normal opacity-80">No Internet</span>
              </button>

              <button
                onClick={() => {
                  if (contacts.length === 0) {
                    toast.error('Please add trusted contacts first!');
                    return;
                  }
                  window.location.href = `tel:${contacts[0].phone}`;
                }}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl flex flex-col items-center shadow-lg"
              >
                <span className="text-2xl mb-1">📞</span>
                <span className="text-sm">Call Contact</span>
                <span className="text-xs font-normal opacity-80">No Internet</span>
              </button>
            </div>

            {/* Custom Emergency Number */}
            <div className="mt-3 bg-white rounded-xl shadow p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                🚨 Emergency Number
              </p>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={emergencyNumber}
                  onChange={(e) => {
                    setEmergencyNumber(e.target.value);
                    localStorage.setItem('emergencyNumber', e.target.value);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                  placeholder="Enter emergency number"
                />
                <button
                  onClick={() => window.location.href = `tel:${emergencyNumber}`}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
                >
                  📞 Call
                </button>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                Default: 112 — Change to any number you prefer
              </p>
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Trusted Contacts</h2>

            {/* Add Contact Form */}
            <div className="bg-white rounded-xl shadow p-4 mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">➕ Add New Contact</h3>
              <form onSubmit={handleAddContact} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter contact name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address * <span className="text-red-400">(Required for alerts)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-gray-400">(Optional - for offline SMS)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="10 digits (XXXXXXXXXX)"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    📱 Used for offline SMS and direct calls when no internet
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={addingContact}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg"
                >
                  {addingContact ? 'Adding...' : '➕ Add Contact'}
                </button>
              </form>
            </div>

            {/* Contacts List */}
            {contacts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-5xl mb-3">👥</div>
                <p>No contacts added yet!</p>
                <p className="text-sm">Add trusted contacts above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact._id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">👤 {contact.name}</p>
                      {contact.email && (
                        <p className="text-gray-500 text-sm">📧 {contact.email}</p>
                      )}
                      {contact.phone && (
                        <p className="text-gray-400 text-sm">📱 {contact.phone}</p>
                      )}
                      {!contact.email && (
                        <p className="text-red-400 text-xs">⚠️ No email — alerts won't be sent!</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteContact(contact._id)}
                      className="bg-red-100 hover:bg-red-200 text-red-500 px-3 py-2 rounded-lg text-sm font-semibold"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fake Call Tab */}
        {activeTab === 'fakecall' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📞</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Fake Call</h2>
            <p className="text-gray-500 mb-8">
              Simulate an incoming call to escape an uncomfortable situation!
            </p>

            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caller Name
              </label>
              <input
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
                placeholder="Enter caller name"
              />
              <button
                onClick={handleFakeCall}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-lg"
              >
                📲 Start Fake Call
              </button>
            </div>

            <p className="text-gray-400 text-sm">
              The fake call screen will appear for 30 seconds
            </p>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">SOS Alert History</h2>

            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-5xl mb-3">📜</div>
                <p>No SOS alerts sent yet!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((alert) => (
                  <div key={alert._id} className="bg-white rounded-xl shadow p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-red-100 text-red-500 px-2 py-1 rounded-full text-xs font-semibold">
                        🚨 SOS Sent
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      📍 Location: {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                    </p>
                    <p className="text-gray-600 text-sm">
                      👥 Notified: {alert.contactsNotified.join(', ')}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${alert.location.lat},${alert.location.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-red-500 text-sm hover:underline"
                    >
                      🗺️ View on Google Maps
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
