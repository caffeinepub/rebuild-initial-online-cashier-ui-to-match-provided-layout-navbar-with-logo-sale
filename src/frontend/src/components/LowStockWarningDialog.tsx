import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';

interface LowStockWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lowStockItems: InventoryItem[];
}

export default function LowStockWarningDialog({
  open,
  onOpenChange,
  lowStockItems,
}: LowStockWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl">Low Stock Alert</DialogTitle>
              <DialogDescription>
                {lowStockItems.length} {lowStockItems.length === 1 ? 'item has' : 'items have'} reached or fallen below minimum stock level
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Minimum Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.map((item) => (
                <TableRow key={item.id.toString()}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-destructive">
                      {Number(item.finalStock)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {Number(item.minimumStock)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
