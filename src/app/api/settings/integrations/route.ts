import { NextResponse } from 'next/server';
import { store } from '@/lib/db/store';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const settings = store.getSettings();
  return NextResponse.json({
    success: true,
    settings: {
      geminiApiKeyConfigured: Boolean(settings.geminiApiKey || process.env.GEMINI_API_KEY),
      geminiApiKey: settings.geminiApiKey ? `${settings.geminiApiKey.slice(0, 6)}...` : '',
      supabaseConfigured: Boolean(settings.supabaseUrl && settings.supabaseAnonKey),
      supabaseUrl: settings.supabaseUrl || '',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { geminiApiKey, supabaseUrl, supabaseAnonKey } = body;

    const updates: Record<string, any> = {};
    if (typeof geminiApiKey === 'string') {
      updates.geminiApiKey = geminiApiKey.trim();
      updates.geminiApiKeyConfigured = Boolean(geminiApiKey.trim());
    }
    if (typeof supabaseUrl === 'string') {
      updates.supabaseUrl = supabaseUrl.trim();
    }
    if (typeof supabaseAnonKey === 'string') {
      updates.supabaseAnonKey = supabaseAnonKey.trim();
      updates.supabaseConfigured = Boolean(updates.supabaseUrl && updates.supabaseAnonKey);
    }

    store.updateSettings(updates);

    // Also persist to .env.local if geminiApiKey provided
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      if (updates.geminiApiKey) {
        if (envContent.includes('GEMINI_API_KEY=')) {
          envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${updates.geminiApiKey}`);
        } else {
          envContent += `\nGEMINI_API_KEY=${updates.geminiApiKey}\n`;
        }
        process.env.GEMINI_API_KEY = updates.geminiApiKey;
      }

      if (updates.supabaseUrl) {
        if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
          envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_URL=.*/, `NEXT_PUBLIC_SUPABASE_URL=${updates.supabaseUrl}`);
        } else {
          envContent += `\nNEXT_PUBLIC_SUPABASE_URL=${updates.supabaseUrl}\n`;
        }
      }

      if (updates.supabaseAnonKey) {
        if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
          envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${updates.supabaseAnonKey}`);
        } else {
          envContent += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${updates.supabaseAnonKey}\n`;
        }
      }

      fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
    } catch (e) {
      console.warn('Could not write to .env.local:', e);
    }

    return NextResponse.json({ success: true, message: 'Integrations updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
