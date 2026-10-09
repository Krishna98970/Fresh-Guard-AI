'use client';

import React, { useState } from 'react';
import { User, Save, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/lib/types';

export default function ProfileSettingsPage() {
  const { user, role, updateProfile, loginAsRole } = useAuth();
  const [name, setName] = useState(user?.name || 'Sarah Chen');
  const [department, setDepartment] = useState(user?.department || 'Executive Logistics');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, department });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="space-y-6">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" /> User Profile & Security Credentials
          </CardTitle>
          <CardDescription>Manage your active persona and operational department</CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSave} className="space-y-4 text-xs max-w-lg">
        <div>
          <label className="block text-slate-400 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Work Email</label>
          <input
            type="email"
            disabled
            value={user?.email || 'admin@freshguard.ai'}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Department</label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Active Role</label>
          <div className="flex items-center gap-2">
            <Badge variant="emerald" dot>
              {role}
            </Badge>
            <select
              value={role}
              onChange={(e) => loginAsRole(e.target.value as UserRole)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="QUALITY_INSPECTOR">QUALITY_INSPECTOR</option>
              <option value="PACKING_OPERATOR">PACKING_OPERATOR</option>
              <option value="DELIVERY_MANAGER">DELIVERY_MANAGER</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <Button type="submit" icon={<Save className="w-3.5 h-3.5" />}>
            Update Profile
          </Button>
          {saved && (
            <span className="text-emerald-400 flex items-center gap-1 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
