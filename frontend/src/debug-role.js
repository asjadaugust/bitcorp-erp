// Debug script to check current user role
const token = localStorage.getItem('access_token');
console.log('Current Token:', token);

if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token Payload:', payload);
    console.log('Role from Token:', payload.rol || payload.roles);
  } catch (e) {
    console.error('Error parsing token:', e);
  }
} else {
  console.warn('No access token found in localStorage');
}
