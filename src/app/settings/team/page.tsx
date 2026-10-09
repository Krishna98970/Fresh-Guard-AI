'use client';

import React, { useState } from 'react';
import { Users, UserPlus, ShieldCheck } from 'lucide-react';
import { store } from '@/lib/db/store';
import { User, UserRole } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function TeamSettingsPage() {
  const [users, setUsers] = useState<User[]>(() => store.getUsers());
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('QUALITY_INSPECTOR');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      organizationId: store.getOrganization().id,
      department: 'Intake Logistics',
      createdAt: new Date().toISOString(),
    };
    store.getUsers().push(newUser);
    setUsers([...store.getUsers()]);
    setIsInviteOpen(false);
    setName('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" /> Authorized Team Members ({users.length})
              </CardTitle>
              <CardDescription>
                Assign operational roles across quality intake, smart packing, and delivery management
              </CardDescription>
            </div>

            <Button
              size="sm"
              onClick={() => setIsInviteOpen(true)}
              icon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Add Member
            </Button>
          </div>
        </CardHeader>

        <div className="divide-y divide-slate-800 text-xs">
          {users.map((u) => (
            <div key={u.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt={u.name}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">
                    {u.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-white">{u.name}</div>
                  <div className="text-[11px] text-slate-400">{u.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  {u.department || 'Operations'}
                </span>
                <Badge variant={u.role === 'ADMIN' ? 'emerald' : 'slate'}>{u.role}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite New Team Member"
        description="Grant role-based operational permissions"
        maxWidth="md"
      >
        <form onSubmit={handleInvite} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan Hayes"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@freshguard.ai"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="QUALITY_INSPECTOR">QUALITY_INSPECTOR</option>
              <option value="PACKING_OPERATOR">PACKING_OPERATOR</option>
              <option value="DELIVERY_MANAGER">DELIVERY_MANAGER</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Send Authorization</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
