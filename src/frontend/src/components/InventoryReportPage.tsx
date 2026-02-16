import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInventoryReport } from '../hooks/useInventoryReport';
import QueryErrorState from './QueryErrorState';
import { Loader2 } from 'lucide-react';
import { normalizeErrorMessage } from '../utils/errorMessage';

export default function InventoryReportPage() {
  const { data: reports, isLoading, error, refetch } = useInventoryReport();

  const sortedReports = useMemo(() => {
    if (!reports) return [];
    // Reports are already sorted newest first from backend
    return reports;
  }, [reports]);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Override auth errors for inventory reports to show generic error
  const displayError = useMemo(() => {
    if (!error) return null;
    
    const normalized = normalizeErrorMessage(error);
    
    // If it's an auth error, override it to show a generic service error
    // since inventory reports should be accessible without authentication
    if (normalized.isAuthError) {
      return {
        title: 'Service Error',
        message: 'Unable to load inventory reports. Please try again.',
      };
    }
    
    return {
      title: normalized.title,
      message: normalized.message,
    };
  }, [error]);

  if (error && displayError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Inventory Report</h1>
        </div>
        <QueryErrorState 
          error={error} 
          onRetry={refetch}
          title={displayError.title}
          message={displayError.message}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Inventory Report</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Adjustment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedReports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No stock adjustments recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedReports.map((report, index) => (
                    <TableRow key={index}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(report.timestamp)}
                      </TableCell>
                      <TableCell className="font-medium">{report.itemName}</TableCell>
                      <TableCell>{report.itemSize}</TableCell>
                      <TableCell className="text-right font-mono">
                        {report.quantity.toString()}
                      </TableCell>
                      <TableCell className="max-w-md">{report.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
