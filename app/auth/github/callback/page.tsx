"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function GitHubCallback() {
  const router = useRouter();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;

    const userInfo = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      if (!code) return;
    
      try {
        const backendResponse: any = await axios.post('http://localhost:5000/auth/github/callback', { code });
        console.log("backend response is: ", backendResponse.data);
        localStorage.setItem('token', backendResponse.data.token);
        localStorage.setItem('userInfo', JSON.stringify(backendResponse.data))
        router.push("/home");
      } catch (err: any) {
        console.error("Error during GitHub login:", err);
      }
    };

    userInfo();
    
  }, []);

  return <p>Logging in...</p>;
}
