import { signInWithEmail } from '@/app/auth/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default async function PrihlaseniPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#7c9a6e] mb-3">
            <span className="text-2xl">🌾</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">FarmaSamec</h1>
          <p className="text-sm text-gray-500 mt-1">Webová správa farmy</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Přihlásit se</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={signInWithEmail} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vas@email.cz"
                className="border-gray-200 focus-visible:ring-[#7c9a6e]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Heslo
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="border-gray-200 focus-visible:ring-[#7c9a6e]"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#7c9a6e] hover:bg-[#6b8860] text-white font-semibold"
            >
              Přihlásit se
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Přihlaste se stejným účtem jako v mobilní appce.
        </p>
      </div>
    </div>
  );
}
