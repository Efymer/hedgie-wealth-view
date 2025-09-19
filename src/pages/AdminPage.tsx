import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCw, Crown, Calendar, User, Settings } from "lucide-react";

interface PremiumAccount {
  id: string;
  accountId: string;
  purchaseDate: string;
  expirationDate: string;
  nftTokenId: string;
  status: "active" | "expired" | "pending";
}

const AdminPage: React.FC = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAccountId, setNewAccountId] = useState("");
  
  // Mock data for premium accounts
  const [premiumAccounts, setPremiumAccounts] = useState<PremiumAccount[]>([
    {
      id: "1",
      accountId: "0.0.123456",
      purchaseDate: "2024-01-15",
      expirationDate: "2024-02-14",
      nftTokenId: "0.0.789123",
      status: "active"
    },
    {
      id: "2", 
      accountId: "0.0.654321",
      purchaseDate: "2024-01-10",
      expirationDate: "2024-02-09",
      nftTokenId: "0.0.789124",
      status: "active"
    },
    {
      id: "3",
      accountId: "0.0.111222",
      purchaseDate: "2023-12-15",
      expirationDate: "2024-01-14", 
      nftTokenId: "0.0.789125",
      status: "expired"
    },
    {
      id: "4",
      accountId: "0.0.333444",
      purchaseDate: "2024-01-20",
      expirationDate: "2024-02-19",
      nftTokenId: "0.0.789126",
      status: "pending"
    }
  ]);

  const handleAddAccount = () => {
    if (!/^0\.0\.\d+$/.test(newAccountId)) {
      toast({
        title: "Error",
        description: "Invalid Hedera account ID format",
        variant: "destructive",
      });
      return;
    }

    const newAccount: PremiumAccount = {
      id: Date.now().toString(),
      accountId: newAccountId,
      purchaseDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nftTokenId: `0.0.${Math.floor(Math.random() * 999999)}`,
      status: "active"
    };

    setPremiumAccounts([...premiumAccounts, newAccount]);
    setNewAccountId("");
    setIsAddDialogOpen(false);
    
    toast({
      title: "Success",
      description: `Added premium access for ${newAccountId}`,
    });
  };

  const handleRemoveAccount = (accountId: string) => {
    setPremiumAccounts(premiumAccounts.filter(acc => acc.id !== accountId));
    toast({
      title: "Success",
      description: "Premium account removed",
    });
  };

  const handleRecalculateNetWorth = (accountId: string) => {
    // Mock function - would trigger backend calculation
    toast({
      title: "Net Worth Recalculation Started",
      description: `Recalculating net worth for ${accountId}...`,
    });
  };

  const handleBulkRecalculate = () => {
    toast({
      title: "Bulk Recalculation Started", 
      description: "Recalculating net worth for all premium accounts...",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-success/10 text-success border-success/20",
      expired: "bg-destructive/10 text-destructive border-destructive/20", 
      pending: "bg-warning/10 text-warning border-warning/20"
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const activeCount = premiumAccounts.filter(acc => acc.status === "active").length;
  const expiredCount = premiumAccounts.filter(acc => acc.status === "expired").length;
  const pendingCount = premiumAccounts.filter(acc => acc.status === "pending").length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-accent" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage premium accounts and system operations</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Premium Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Premium Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="accountId">Account ID</Label>
                  <Input
                    id="accountId"
                    placeholder="0.0.123456"
                    value={newAccountId}
                    onChange={(e) => setNewAccountId(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddAccount} className="w-full">
                  Add Premium Access
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={handleBulkRecalculate}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Bulk Recalculate
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="glass-card p-6">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-success" />
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Active Premium</p>
            </div>
          </div>
        </Card>
        
        <Card className="glass-card p-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{expiredCount}</p>
              <p className="text-sm text-muted-foreground">Expired</p>
            </div>
          </div>
        </Card>
        
        <Card className="glass-card p-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-warning" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>
        
        <Card className="glass-card p-6">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-accent" />
            <div>
              <p className="text-2xl font-bold">{premiumAccounts.length}</p>
              <p className="text-sm text-muted-foreground">Total Accounts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Premium Accounts Table */}
      <Card className="glass-card">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-xl font-semibold">Premium Accounts</h2>
          <p className="text-sm text-muted-foreground">Manage premium subscriptions and access</p>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account ID</TableHead>
                <TableHead>NFT Token ID</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Expiration Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {premiumAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono">{account.accountId}</TableCell>
                  <TableCell className="font-mono text-sm">{account.nftTokenId}</TableCell>
                  <TableCell>{account.purchaseDate}</TableCell>
                  <TableCell>{account.expirationDate}</TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRecalculateNetWorth(account.accountId)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Recalc
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveAccount(account.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default AdminPage;