import { AlertTriangle } from 'lucide-react';
import type { InventoryItem } from '../backend';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LowStockBannerProps {
  lowStockItems: InventoryItem[];
}

export default function LowStockBanner({ lowStockItems }: LowStockBannerProps) {
  if (lowStockItems.length === 0) {
    return null;
  }

  return (
    <Card className="bg-[oklch(var(--warning-low-stock))] border-[oklch(var(--warning-low-stock-foreground)/0.2)]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <CardTitle className="text-base font-semibold">
            Low Stock Alert - {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'} need attention
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="border border-border rounded-lg overflow-hidden bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Initial Stock</TableHead>
                <TableHead className="text-right">Reject</TableHead>
                <TableHead className="text-right">Final Stock</TableHead>
                <TableHead className="text-right">Minimum Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.map((item) => (
                <TableRow 
                  key={item.id.toString()}
                  className="bg-[oklch(var(--warning-low-stock))] hover:bg-[oklch(var(--warning-low-stock))] dark:bg-[oklch(var(--warning-low-stock))] dark:hover:bg-[oklch(var(--warning-low-stock))]"
                >
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{Number(item.initialStock)}</TableCell>
                  <TableCell className="text-right">{Number(item.reject)}</TableCell>
                  <TableCell className="text-right font-semibold text-destructive">
                    {Number(item.finalStock)}
                  </TableCell>
                  <TableCell className="text-right">{Number(item.minimumStock)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
