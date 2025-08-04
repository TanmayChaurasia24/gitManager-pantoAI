
import toast, { Toaster } from 'react-hot-toast';


export const handleLogin = () => {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!;
  const redirectUri = "http://localhost:3000/auth/github/callback";
  window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user user:email`;
};

export const handleLogout = () => {
  try {
    if(localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('userInfo');
    }
    toast.success("logged out sucessfully!");
    return true;
  } catch (error) {
    toast.error("error, please try again later!");
    return;
  }
}