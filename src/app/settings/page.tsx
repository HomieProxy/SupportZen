import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight font-headline">
        Settings
      </h2>
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <Label htmlFor="theme" className="font-medium">
                    Theme
                </Label>
                <ThemeToggle />
            </div>
            <p className="text-sm text-muted-foreground">
                Select the color scheme for the dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
