
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Database } from "lucide-react";

const settingsCategories = [
  {
    title: "Custom Fields",
    description: "Manage pre-defined custom fields for products",
    href: "/dashboard/settings/custom-fields",
    icon: Database,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Settings Categories</h3>
        <p className="text-sm text-muted-foreground">
          Configure system settings and preferences.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsCategories.map((category) => (
          <Link href={category.href} key={category.title}>
            <Card className="cursor-pointer transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="h-5 w-5" />
                  {category.title}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
