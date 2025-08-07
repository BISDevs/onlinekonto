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
import { Progress } from '@/components/ui/progress';
import {
  PiggyBank,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  Download
} from 'lucide-react';
import { apiGetAnlagen, apiGetUsers, apiDeleteAnlage } from '@/lib/api-storage';
import { FestgeldAnlage, User } from '@/lib/types';
import { AnlageModal } from '@/components/admin/anlage-modal';
import { DeleteConfirmationModal } from '@/components/admin/delete-confirmation-modal';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminAnlagenPage() {
  const [anlagen, setAnlagen] = useState<FestgeldAnlage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredAnlagen, setFilteredAnlagen] = useState<FestgeldAnlage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [isAnlageModalOpen, setIsAnlageModalOpen] = useState(false);
  const [editingAnlage, setEditingAnlage] = useState<FestgeldAnlage | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [anlageToDelete, setAnlageToDelete] = useState<FestgeldAnlage | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    filterAnlagen();
  }, [anlagen, searchTerm, statusFilter, userFilter]);

  const refreshData = async () => {
    try {
      const [anlagenData, usersData] = await Promise.all([
        apiGetAnlagen(),
        apiGetUsers()
      ]);
      setAnlagen(anlagenData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const filterAnlagen = () => {
    let filtered = anlagen;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(anlage =>
        anlage.id.toString().includes(searchTerm) ||
        anlage.betrag.toString().includes(searchTerm) ||
        anlage.zinssatz.toString().includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(anlage => anlage.status === statusFilter);
    }

    // Filter by user
    if (userFilter !== 'all') {
      filtered = filtered.filter(anlage => anlage.user_id === userFilter);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredAnlagen(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktiv':
        return <Badge className="bg-green-500">Aktiv</Badge>;
      case 'beendet':
        return <Badge variant="secondary">Beendet</Badge>;
      case 'vorzeitig_beendet':
        return <Badge className="bg-yellow-500">Vorzeitig beendet</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgress = (anlage: FestgeldAnlage) => {
    const startDate = new Date(anlage.start_datum);
    const endDate = new Date(anlage.end_datum);
    const now = new Date();

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();

    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : `Benutzer ${userId}`;
  };

  const handleCreateAnlage = () => {
    setEditingAnlage(null);
    setIsAnlageModalOpen(true);
  };

  const handleEditAnlage = (anlage: FestgeldAnlage) => {
    setEditingAnlage(anlage);
    setIsAnlageModalOpen(true);
  };

  const handleDeleteAnlage = (anlage: FestgeldAnlage) => {
    setAnlageToDelete(anlage);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAnlage = async () => {
    if (!anlageToDelete) return;

    try {
      const success = await apiDeleteAnlage(anlageToDelete.id);
      if (success) {
        await refreshData();
        toast.success('Anlage erfolgreich gelöscht');
      } else {
        toast.error('Fehler beim Löschen der Anlage');
      }
    } catch (error) {
      toast.error('Fehler beim Löschen der Anlage');
    }
  };

  const handleModalSuccess = async () => {
    await refreshData();
  };

  // Calculate statistics
  const totalInvestments = anlagen.reduce((sum, a) => sum + a.betrag, 0);
  const totalInterest = anlagen.reduce((sum, a) => sum + a.zinsbetrag, 0);
  const activeAnlagen = anlagen.filter(a => a.status === 'aktiv');
  const expiringSoon = activeAnlagen.filter(a => {
    const daysRemaining = getDaysRemaining(a.end_datum);
    return daysRemaining <= 30 && daysRemaining > 0;
  });

  return (
    <AppLayout adminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Anlagenverwaltung</h1>
            <p className="text-gray-600">Verwalten Sie alle Festgeldanlagen im System</p>
          </div>
          <Button onClick={handleCreateAnlage} className="bg-gray-900 hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Neue Anlage
          </Button>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gesamte Anlagen</p>
                  <p className="text-2xl font-bold">{anlagen.length}</p>
                </div>
                <PiggyBank className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aktive Anlagen</p>
                  <p className="text-2xl font-bold text-green-600">{activeAnlagen.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gesamtvolumen</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalInvestments)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Laufen bald ab</p>
                  <p className="text-2xl font-bold text-yellow-600">{expiringSoon.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {expiringSoon.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {expiringSoon.length} Anlagen laufen in den nächsten 30 Tagen ab
                  </p>
                  <p className="text-sm text-yellow-700">
                    Überprüfen Sie diese Anlagen und informieren Sie die Kunden über die bevorstehende Fälligkeit.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Suche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Suche nach ID, Betrag oder Zinssatz</Label>
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
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="aktiv">Aktiv</SelectItem>
                    <SelectItem value="beendet">Beendet</SelectItem>
                    <SelectItem value="vorzeitig_beendet">Vorzeitig beendet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="user-filter">Benutzer</Label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Benutzer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Benutzer</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Anlagen Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Festgeldanlagen ({filteredAnlagen.length} von {anlagen.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAnlagen.length === 0 ? (
              <div className="text-center py-12">
                <PiggyBank className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {anlagen.length === 0 ? 'Keine Anlagen' : 'Keine Ergebnisse'}
                </h3>
                <p className="text-gray-600">
                  {anlagen.length === 0
                    ? 'Erstellen Sie die erste Festgeldanlage.'
                    : 'Keine Anlagen entsprechen Ihren Filterkriterien.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Anlage</TableHead>
                      <TableHead>Kunde</TableHead>
                      <TableHead>Betrag</TableHead>
                      <TableHead>Zinssatz</TableHead>
                      <TableHead>Laufzeit</TableHead>
                      <TableHead>Fortschritt</TableHead>
                      <TableHead>Erträge</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnlagen.map((anlage) => {
                      const progress = getProgress(anlage);
                      const daysRemaining = getDaysRemaining(anlage.end_datum);
                      const userName = getUserName(anlage.user_id);

                      return (
                        <TableRow key={anlage.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">#{anlage.id}</p>
                              <p className="text-sm text-gray-600">
                                {formatDate(anlage.start_datum)} - {formatDate(anlage.end_datum)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Erstellt: {formatDate(anlage.created_at)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{userName}</p>
                              <p className="text-sm text-gray-600">ID: {anlage.user_id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(anlage.betrag)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-green-600">
                              {anlage.zinssatz}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{anlage.laufzeit_monate} Monate</p>
                              {anlage.status === 'aktiv' && daysRemaining > 0 && (
                                <p className="text-xs text-gray-500">
                                  {daysRemaining} Tage verbleibend
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={progress} className="h-2 w-20" />
                              <span className="text-xs text-gray-500">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-green-600">
                                {formatCurrency(anlage.zinsbetrag)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Gesamt: {formatCurrency(anlage.endbetrag)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(anlage.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/anlagen/${anlage.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAnlage(anlage)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteAnlage(anlage)}
                                disabled={anlage.status === 'aktiv'}
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

        {/* Anlage Modal */}
        <AnlageModal
          isOpen={isAnlageModalOpen}
          onClose={() => setIsAnlageModalOpen(false)}
          onSuccess={handleModalSuccess}
          anlage={editingAnlage}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteAnlage}
          title="Anlage löschen"
          description={`Sind Sie sicher, dass Sie die Anlage #${anlageToDelete?.id} löschen möchten?`}
          itemName={`Anlage #${anlageToDelete?.id}`}
          additionalWarnings={[
            'Alle zugehörigen Transaktionen werden ebenfalls gelöscht',
            'Diese Aktion kann nicht rückgängig gemacht werden',
            anlageToDelete?.status === 'aktiv' ? 'Aktive Anlagen können nicht gelöscht werden' : ''
          ].filter(Boolean)}
        />
      </div>
    </AppLayout>
  );
}
