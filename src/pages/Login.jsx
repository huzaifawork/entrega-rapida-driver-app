import { useState } from 'react';
import { firebaseAuth } from '@shared/firebase-auth.js';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await firebaseAuth.login(email, password);
      
      // Check if user is a transporter
      if (!user.roles?.includes('transporter') && !user.approved_roles?.includes('transporter')) {
        setError('Esta conta não tem permissão de transportador.');
        await firebaseAuth.logout();
        setIsLoading(false);
        return;
      }

      navigate('/Dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Email ou senha incorretos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const user = await firebaseAuth.loginWithGoogle();

      if (!user.roles?.includes('transporter') && !user.approved_roles?.includes('transporter')) {
        setError('Esta conta Google não está autorizada como transportador.');
        await firebaseAuth.logout();
        setIsGoogleLoading(false);
        return;
      }

      navigate('/Dashboard');
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message || 'Não foi possível autenticar com Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.7-1.6 2.7-4 2.7-6.8 0-.7-.1-1.4-.2-2h-8.7z" />
      <path fill="#34A853" d="M6.6 14.3l-.9.7-2.4 1.9C4.8 19.9 8.2 22 12 22c2.9 0 5.3-1 7.1-2.7l-3-2.3c-.8.6-1.8 1-3.1 1-2.4 0-4.4-1.6-5.1-3.8z" />
      <path fill="#4A90E2" d="M3.3 7.1C2.5 8.5 2 10.2 2 12s.5 3.5 1.3 4.9c0 0 0-.1.1-.1l3.3-2.5c-.4-.8-.7-1.7-.7-2.7s.2-1.9.7-2.7L3.3 7.1z" />
      <path fill="#FBBC05" d="M12 4.7c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.4 14.9 0 12 0 8.2 0 4.8 2.1 3.3 5.1l3.3 2.5C7.6 6.3 9.6 4.7 12 4.7z" />
      <path fill="none" d="M2 2h20v20H2z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">App de Entregas</CardTitle>
          <p className="text-gray-600 text-sm">Login para Transportadores</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
              Entrar com Google
            </Button>
            <div className="relative flex items-center">
              <span className="flex-1 border-t border-gray-200" />
              <span className="px-3 text-xs text-gray-400 uppercase tracking-wide">ou</span>
              <span className="flex-1 border-t border-gray-200" />
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  A entrar...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
          <p className="text-xs text-center text-gray-500 mt-4">
            Apenas para transportadores autorizados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
