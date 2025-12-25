
// Simula um "backend" criptografando a senha antes de salvar no localStorage.
// Usa Web Crypto API, nativa dos navegadores modernos.

export const generateSalt = (): string => {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const hashPassword = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt); 
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const validatePassword = async (input: string, storedHash: string, salt: string): Promise<boolean> => {
  const inputHash = await hashPassword(input, salt);
  return inputHash === storedHash;
};
