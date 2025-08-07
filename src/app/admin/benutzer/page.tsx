'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  Shield,
  Mail,
  Calendar
} from 'lucide-react';
import { apiGetUsers, apiDeleteUser, apiGetAnlagenByUser, apiGetTransaktionenByUser } from '@/lib/api-storage';
import { User } from '@/lib/types';
import { UserModal } from '@/components/admin/user-modal';
import { DeleteConfirmationModal } from '@/components/admin/delete-confirmation-modal';
import { toast } from 'sonner';
import Link from 'next/link';

interface UserStats {
  anlagenCount: number;
  transaktionenCount: number;
  totalInvestment: number;
}

export default function AdminBenutzerPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});

  useEffect(() => {
    refreshUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const refreshUsers = async () => {
    try {
      const allUsers = await apiGetUsers();
      setUsers(allUsers);
      // Load stats for each user
      allUsers.forEach(user => {
        loadUserStats(user.id);
      });
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  };

  const loadUserStats = async (userId: string) => {
    if (loadingStats[userId]) return; // Prevent duplicate requests

    setLoadingStats(prev => ({ ...prev, [userId]: true }));

    try {
      const [anlagen, transaktionen] = await Promise.all([
        apiGetAnlagenByUser(userId),
        apiGetTransaktionenByUser(userId)
      ]);

      const totalInvestment = anlagen.reduce((sum, anlage) => sum + anlage.betrag, 0);

      setUserStats(prev => ({
        ...prev,
        [userId]: {
          anlagenCount: anlagen.length,
          transaktionenCount: transaktionen.length,
          totalInvestment
        }
      }));
    } catch (error) {
      console.error(`Error loading stats for user ${userId}:`, error);
      // Set default values on error
      setUserStats(prev => ({
        ...prev,
        [userId]: {
          anlagenCount: 0,
          transaktionenCount: 0,
          totalInvestment: 0
        }
      }));
    } finally {
      setLoadingStats(prev => ({ ...prev, [userId]: false }));
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const success = await apiDeleteUser(userToDelete.id);
      if (success) {
        await refreshUsers();
        toast.success('Benutzer erfolgreich gelöscht');
      } else {
        toast.error('Fehler beim Löschen des Benutzers');
      }
    } catch (error) {
      toast.error('Fehler beim Löschen des Benutzers');
    }
  };

  const handleModalSuccess = async () => {
    await refreshUsers();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge className="bg-gray-900 text-white">
        <Shield className="h-3 w-3 mr-1" />
        Administrator
      </Badge>
    ) : (
      <Badge variant="outline">
        <UserCheck className="h-3 w-3 mr-1" />
        Benutzer
      </Badge>
    );
  };

  const getUserStats = (userId: string): UserStats => {
    return userStats[userId] || {
      anlagenCount: 0,
      transaktionenCount: 0,
      totalInvestment: 0
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <AppLayout adminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
            <p className="text-gray-600">Verwalten Sie alle Systembenutzer</p>
          </div>

          <Button onClick={handleCreateUser} className="bg-gray-900 hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Benutzer
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gesamte Benutzer</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Administratoren</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Standard-Benutzer</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.role === 'user').length}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Suche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">Suche nach Name oder E-Mail</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role-filter">Rolle filtern</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Rollen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Rollen</SelectItem>
                    <SelectItem value="admin">Administratoren</SelectItem>
                    <SelectItem value="user">Benutzer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Benutzer ({filteredUsers.length} von {users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {users.length === 0 ? 'Keine Benutzer' : 'Keine Ergebnisse'}
                </h3>
                <p className="text-gray-600">
                  {users.length === 0
                    ? 'Erstellen Sie den ersten Benutzer.'
                    : 'Keine Benutzer entsprechen Ihren Filterkriterien.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Benutzer</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Erstellt</TableHead>
                      <TableHead>Anlagen</TableHead>
                      <TableHead>Investitionen</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const stats = getUserStats(user.id);
                      const isLoading = loadingStats[user.id];
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{user.name}</p>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                              <p className="text-xs text-gray-500 font-mono">ID: {user.id}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(user.role)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {formatDate(user.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {isLoading ? (
                                <div className="animate-pulse">
                                  <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                                </div>
                              ) : (
                                <>
                                  <p className="font-medium">{stats.anlagenCount} Anlagen</p>
                                  <p className="text-gray-500">{stats.transaktionenCount} Transaktionen</p>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isLoading ? (
                              <div className="animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-20"></div>
                              </div>
                            ) : (
                              <p className="font-semibold">
                                {formatCurrency(stats.totalInvestment)}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/benutzer/${user.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteUser(user)}
                                disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Modal */}
        <UserModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          onSuccess={handleModalSuccess}
          user={editingUser}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteUser}
          title="Benutzer löschen"
          description={`Sind Sie sicher, dass Sie den Benutzer "${userToDelete?.name}" löschen möchten?`}
          itemName={userToDelete?.name || ''}
          additionalWarnings={[
            'Alle zugehörigen Anlagen und Transaktionen werden ebenfalls gelöscht',
            'Diese Aktion kann nicht rückgängig gemacht werden',
            userToDelete?.role === 'admin' ? 'Administrator-Rechte gehen verloren' : ''
          ].filter(Boolean)}
        />
      </div>
    </AppLayout>
  );
}
