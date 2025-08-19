import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings as SettingsIcon, Download, Smartphone, Database } from "lucide-react";

const Settings = () => {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) =>
      setEmail(data.user?.email ?? null)
    );
  }, []);

  async function signIn() {
    const e = prompt("Email:")?.trim();
    const p = prompt("Password:") ?? "";
    if (!e || !p) return;
    const { data, error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    if (error) return alert(error.message);
    setEmail(data.user?.email ?? null);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setEmail(null);
  }
      


  const handleExportCSV = () => {
    // This will be implemented with real data later
    console.log("Exporting CSV...");
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">App settings and data export</p>
      </div>

            {/* Account */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>Account: {email ?? "(not signed in)"}</div>
          <div className="space-x-2">
            <Button onClick={signIn}>Sign in</Button>
            <Button variant="secondary" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </Card>


      {/* Export Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Data Export</h2>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Download className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Export to CSV</h3>
              <p className="text-sm text-muted-foreground">
                Download all your baby's activity data
              </p>
            </div>
            <Button onClick={handleExportCSV} variant="outline">
              Export
            </Button>
          </div>
        </Card>
      </div>

      {/* App Info Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">App Information</h2>
        
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Smartphone className="h-8 w-8 text-accent" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Mobile Ready</h3>
              <p className="text-sm text-muted-foreground">
                Install on your phone for the best experience
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Database className="h-8 w-8 text-diaper" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Cloud Sync</h3>
              <p className="text-sm text-muted-foreground">
                Data syncs automatically across all your devices
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Next Steps</h2>
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">🚀 Ready for mobile and data sync!</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Your BabyLog app needs a backend to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Sync data between your 3 phones</li>
                <li>Store all activity history</li>
                <li>Enable CSV export functionality</li>
                <li>Work as a mobile app</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;