'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Calculator, TrendingUp, Euro, Calendar } from 'lucide-react';
import { calculateInterest } from '@/lib/api-storage';

interface CalculationResult {
  betrag: number;
  zinssatz: number;
  laufzeit: number;
  zinsbetrag: number;
  endbetrag: number;
  monatlicheZinsen: number;
}

export default function ZinsrechnerPage() {
  const [betrag, setBetrag] = useState<string>('');
  const [zinssatz, setZinssatz] = useState<string>('');
  const [laufzeit, setLaufzeit] = useState<string>('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [history, setHistory] = useState<CalculationResult[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleCalculate = () => {
    const betragNum = parseFloat(betrag);
    const zinssatzNum = parseFloat(zinssatz);
    const laufzeitNum = parseInt(laufzeit);

    if (isNaN(betragNum) || isNaN(zinssatzNum) || isNaN(laufzeitNum)) {
      return;
    }

    if (betragNum <= 0 || zinssatzNum < 0 || laufzeitNum <= 0) {
      return;
    }

    const calculation = calculateInterest(betragNum, zinssatzNum, laufzeitNum);

    const newResult: CalculationResult = {
      betrag: betragNum,
      zinssatz: zinssatzNum,
      laufzeit: laufzeitNum,
      zinsbetrag: calculation.zinsbetrag,
      endbetrag: calculation.endbetrag,
      monatlicheZinsen: calculation.zinsbetrag / laufzeitNum
    };

    setResult(newResult);
    setHistory(prev => [newResult, ...prev.slice(0, 4)]); // Keep last 5 calculations
  };

  const handleReset = () => {
    setBetrag('');
    setZinssatz('');
    setLaufzeit('');
    setResult(null);
  };

  const getMonthlyBreakdown = () => {
    if (!result) return [];

    const breakdown = [];
    let currentAmount = result.betrag;
    const monthlyInterestRate = result.zinssatz / 100 / 12;

    for (let month = 1; month <= Math.min(result.laufzeit, 24); month++) {
      const monthlyInterest = currentAmount * monthlyInterestRate;
      currentAmount += monthlyInterest;

      breakdown.push({
        month,
        monthlyInterest,
        totalAmount: currentAmount,
        totalInterest: currentAmount - result.betrag
      });
    }

    return breakdown;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zinsrechner</h1>
          <p className="text-gray-600">Berechnen Sie Ihre potentiellen Zinserträge für Festgeldanlagen</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calculator Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Zinsberechnung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="betrag">Anlagebetrag (€)</Label>
                  <Input
                    id="betrag"
                    type="number"
                    placeholder="z.B. 10000"
                    value={betrag}
                    onChange={(e) => setBetrag(e.target.value)}
                    min="1"
                    step="1"
                  />
                </div>

                <div>
                  <Label htmlFor="zinssatz">Zinssatz pro Jahr (%)</Label>
                  <Input
                    id="zinssatz"
                    type="number"
                    placeholder="z.B. 3.5"
                    value={zinssatz}
                    onChange={(e) => setZinssatz(e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </div>

                <div>
                  <Label htmlFor="laufzeit">Laufzeit (Monate)</Label>
                  <Input
                    id="laufzeit"
                    type="number"
                    placeholder="z.B. 12"
                    value={laufzeit}
                    onChange={(e) => setLaufzeit(e.target.value)}
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCalculate}
                  className="flex-1 bg-gray-900 hover:bg-gray-800"
                  disabled={!betrag || !zinssatz || !laufzeit}
                >
                  Berechnen
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                >
                  Zurücksetzen
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Berechnungsergebnis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Euro className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-600 font-medium">Anlagebetrag</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(result.betrag)}
                      </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Zinserträge</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(result.zinsbetrag)}
                      </p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-purple-600 font-medium">Laufzeit</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">
                        {result.laufzeit} Monate
                      </p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Euro className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600 font-medium">Endbetrag</span>
                      </div>
                      <p className="text-2xl font-bold text-red-900">
                        {formatCurrency(result.endbetrag)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Zinssatz:</span>
                        <span className="font-medium">{result.zinssatz}% p.a.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monatliche Zinsen:</span>
                        <span className="font-medium">{formatCurrency(result.monatlicheZinsen)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rendite gesamt:</span>
                        <span className="font-medium text-green-600">
                          {((result.zinsbetrag / result.betrag) * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Monthly Breakdown */}
        {result && result.laufzeit <= 24 && (
          <Card>
            <CardHeader>
              <CardTitle>Monatliche Entwicklung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Monat</TableHead>
                      <TableHead>Monatszinsen</TableHead>
                      <TableHead>Gesamtbetrag</TableHead>
                      <TableHead>Zinsen gesamt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getMonthlyBreakdown().map((month) => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(month.monthlyInterest)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(month.totalAmount)}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          {formatCurrency(month.totalInterest)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calculation History */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Berechnungshistorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Betrag</TableHead>
                      <TableHead>Zinssatz</TableHead>
                      <TableHead>Laufzeit</TableHead>
                      <TableHead>Zinserträge</TableHead>
                      <TableHead>Endbetrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((calc, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatCurrency(calc.betrag)}</TableCell>
                        <TableCell>{calc.zinssatz}%</TableCell>
                        <TableCell>{calc.laufzeit} Monate</TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(calc.zinsbetrag)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(calc.endbetrag)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
