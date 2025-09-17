import React from "react";
import { useNavigate } from "react-router-dom";
import { ExplorerLanding } from "@/components/ExplorerLanding";
import { useToast } from "@/hooks/use-toast";

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = (id: string) => {
    if (!/^0\.0\.\d+$/.test(id)) {
      toast({
        title: "Error",
        description: "Invalid Hedera account ID format",
        variant: "destructive",
      });
      return;
    }
    navigate(`/explorer/${id}`);
  };

  return (
    <ExplorerLanding
      onSearch={handleSearch}
      onSelect={(address) => navigate(`/explorer/${address}`)}
      isSearchLoading={false}
    />
  );
};

export default Landing;
