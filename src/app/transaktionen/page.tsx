'use client';

import { useAuth } from '@/lib/auth-context';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Filter,
  Download
} from 'lucide-react';
import { apiGetTransaktionenByUser } from '@/lib/api-storage';
import { Transaktion } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function TransaktionenPage() {
  const { user } = useAuth();
  const [transaktionen, setTransaktionen] = useState<Transaktion[]>([]);
  const [filteredTransaktionen, setFilteredTransaktionen] = useState<Transaktion[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (user) {
      const loadTransaktionen = async () => {
        try {
          const allTransaktionen = await apiGetTransaktionenByUser(user.id);
          setTransaktionen(allTransaktionen);
          setFilteredTransaktionen(allTransaktionen);
        } catch (error) {
          console.error('Error loading transaktionen:', error);
        }
      };
      loadTransaktionen();
    }
  }, [user]);

  useEffect(() => {
    let filtered = transaktionen;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.typ === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.beschreibung?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.betrag.toString().includes(searchTerm)
      );
    }

    setFilteredTransaktionen(filtered);
  }, [transaktionen, filterType, searchTerm]);

  const getTypeIcon = (typ: string) => {
    switch (typ) {
      case 'einzahlung':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'auszahlung':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'zinsgutschrift':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (typ: string) => {
    switch (typ) {
      case 'einzahlung':
        return <Badge className="bg-green-500">Einzahlung</Badge>;
      case 'auszahlung':
        return <Badge className="bg-red-500">Auszahlung</Badge>;
      case 'zinsgutschrift':
        return <Badge className="bg-blue-500">Zinsgutschrift</Badge>;
      default:
        return <Badge variant="outline">{typ}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAmountDisplay = (transaktion: Transaktion) => {
    const amount = formatCurrency(transaktion.betrag);
    const colorClass = transaktion.typ === 'auszahlung' ? 'text-red-600' : 'text-green-600';
    const prefix = transaktion.typ === 'auszahlung' ? '-' : '+';

    return (
      <span className={`font-semibold ${colorClass}`}>
        {prefix}{amount}
      </span>
    );
  };

  // Calculate totals
  const totalEinzahlungen = transaktionen
    .filter(t => t.typ === 'einzahlung')
    .reduce((sum, t) => sum + t.betrag, 0);

  const totalAuszahlungen = transaktionen
    .filter(t => t.typ === 'auszahlung')
    .reduce((sum, t) => sum + t.betrag, 0);

  const totalZinsen = transaktionen
    .filter(t => t.typ === 'zinsgutschrift')
    .reduce((sum, t) => sum + t.betrag, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaktionen</h1>
          <p className="text-gray-600">Übersicht über alle Ihre Transaktionen und Bewegungen</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gesamt Einzahlungen</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalEinzahlungen)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gesamt Auszahlungen</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalAuszahlungen)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Zinsgutschriften</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalZinsen)}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-600" />
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
                <Label htmlFor="search">Suche in Beschreibung oder Betrag</Label>
                <Input
                  id="search"
                  placeholder="Suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="type-filter">Transaktionstyp</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Typen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Typen</SelectItem>
                    <SelectItem value="einzahlung">Einzahlungen</SelectItem>
                    <SelectItem value="auszahlung">Auszahlungen</SelectItem>
                    <SelectItem value="zinsgutschrift">Zinsgutschriften</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Transaktionshistorie ({filteredTransaktionen.length} von {transaktionen.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransaktionen.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {transaktionen.length === 0 ? 'Keine Transaktionen' : 'Keine Ergebnisse'}
                </h3>
                <p className="text-gray-600">
                  {transaktionen.length === 0
                    ? 'Sie haben noch keine Transaktionen durchgeführt.'
                    : 'Keine Transaktionen entsprechen Ihren Filterkriterien.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum & Zeit</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead>Anlage-ID</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransaktionen.map((transaktion) => (
                      <TableRow key={transaktion.id}>
                        <TableCell className="font-medium">
                          {formatDateTime(transaktion.datum)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(transaktion.typ)}
                            {getTypeBadge(transaktion.typ)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={transaktion.beschreibung}>
                            {transaktion.beschreibung || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaktion.anlage_id ? (
                            <Badge variant="outline">#{transaktion.anlage_id}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {getAmountDisplay(transaktion)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
