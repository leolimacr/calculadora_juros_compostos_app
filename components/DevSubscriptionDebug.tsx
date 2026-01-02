/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AppUserDoc } from '../types/user';

const DevSubscriptionDebug: React.FC = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<AppUserDoc | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setUserData(snap.data() as AppUserDoc);
      }
    };
    fetchUser();
  }, [user, isVisible]);

  if (!import.meta.env.DEV) return null;

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-2 left-2 bg-red-900/50 text-red-200 text-[10px] px-2 py-1 rounded z-50 border border-red-500/30"
      >
        DEBUG
      </button>
    );
  }

  return (
    <div className="fixed bottom-2 left-2 z-50 bg-black/90 p-4 rounded-xl border border-red-500 w-80 text-[10px] font-mono text-green-400 shadow-2xl">
      <div className="flex justify-between items-center mb-2">
        <strong className="text-white">DEV SUBSCRIPTION DEBUG</strong>
        <button onClick={() => setIsVisible(false)} className="text-red-500 font-bold">X</button>
      </div>
      <div className="max-h-60 overflow-auto">
        <p className="text-blue-300">UID: {user?.uid}</p>
        <pre>{JSON.stringify(userData?.subscription, null, 2)}</pre>
        <pre>{JSON.stringify(userData?.access, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DevSubscriptionDebug;